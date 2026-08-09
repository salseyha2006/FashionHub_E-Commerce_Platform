// src/controllers/khqr.controller.js
const prisma = require('../config/db');
const { generateKhqr, checkPaid } = require('../services/khqr.service');

// ── Customer checkout (order already exists, status = 'pending') ──────────

// POST /api/orders/:id/khqr/generate — customer, must own the order
async function generateForOrder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentMethod !== 'qr') {
      return res.status(400).json({ success: false, message: 'This order is not set up for KHQR payment' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This order is no longer awaiting payment' });
    }

    const { qrString, md5, qrImage, expiresAt } = await generateKhqr(order.totalAmount, order.orderNumber);

    await prisma.order.update({
      where: { id },
      data: { khqrMd5: md5, khqrPayload: qrString, khqrExpiresAt: expiresAt },
    });

    return res.json({ success: true, data: { qrImage, md5, expiresAt } });
  } catch (err) {
    console.error('generateForOrder (KHQR) error:', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to generate KHQR' });
  }
}

// GET /api/orders/:id/khqr/status — customer, must own the order
async function getOrderKhqrStatus(req, res) {
  // Polling endpoint — must never be cached by the browser or any proxy,
  // or the client keeps re-showing a stale "PENDING" body via 304s forever
  // even once the order is actually paid.
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      // Already confirmed (paid) or moved on / cancelled — nothing to poll.
      return res.json({ success: true, data: { status: order.status === 'cancelled' ? 'CANCELLED' : 'PAID', paidAt: order.paidAt } });
    }

    if (!order.khqrMd5) {
      return res.status(400).json({ success: false, message: 'No KHQR code has been generated for this order yet' });
    }

    if (order.khqrExpiresAt && new Date() > order.khqrExpiresAt) {
      return res.json({ success: true, data: { status: 'EXPIRED' } });
    }

    const { paid } = await checkPaid(order.khqrMd5);

    if (paid) {
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'confirmed', paidAt: new Date() },
      });
      return res.json({ success: true, data: { status: 'PAID', paidAt: updated.paidAt } });
    }

    return res.json({ success: true, data: { status: 'PENDING' } });
  } catch (err) {
    console.error('getOrderKhqrStatus error:', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to check payment status' });
  }
}

// ── POS (no order yet — cashier wants a QR to show the customer first) ────
// The order itself is only created by the existing /admin/pos/checkout once
// payment is confirmed (auto-detected, or manually by the cashier), so
// there's nothing to persist here — each call is stateless against Bakong.

// POST /api/admin/pos/khqr/generate  body: { amount, reference? }
async function generateForPos(req, res) {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required' });
    }
    const reference = req.body.reference ? String(req.body.reference) : `POS-${Date.now()}`;

    const { md5, qrImage, expiresAt } = await generateKhqr(amount, reference);

    return res.json({ success: true, data: { qrImage, md5, expiresAt } });
  } catch (err) {
    console.error('generateForPos (KHQR) error:', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to generate KHQR' });
  }
}

// GET /api/admin/pos/khqr/status/:md5
async function getPosKhqrStatus(req, res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const { md5 } = req.params;
    const { paid } = await checkPaid(md5);
    return res.json({ success: true, data: { status: paid ? 'PAID' : 'PENDING' } });
  } catch (err) {
    console.error('getPosKhqrStatus error:', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Failed to check payment status' });
  }
}

module.exports = { generateForOrder, getOrderKhqrStatus, generateForPos, getPosKhqrStatus };
