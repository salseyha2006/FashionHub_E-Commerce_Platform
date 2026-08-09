// src/controllers/pos.controller.js
// In-store POS checkout: admin searches variants by product name or scans
// a variant's SKU/barcode, adds them to a running sale, then checks out
// as a completed ("delivered") order — stock decrements the same way the
// customer-facing checkout does.
const prisma = require('../config/db');
const { validatePosCheckoutInput } = require('../utils/validators');
const { toPosVariant, toAdminOrderDetail } = require('../utils/serializers');
const { generateOrderNumber } = require('../utils/orderNumber');

// GET /api/admin/pos/products?q=...
// Matches on product name OR an exact/prefix SKU match, so the same input
// box handles both typed searches and barcode-scanner input (scanners just
// type the code + Enter). With no q, returns a default browsable list so
// the page isn't empty before the cashier types anything.
// GET /api/admin/pos/products?q=...&category=<slug>
async function searchPosVariants(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const categorySlug = (req.query.category || '').trim();

    const variants = await prisma.productVariant.findMany({
      where: {
        product: {
          isActive: true,
          ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        },
        ...(q
          ? {
              OR: [
                { sku: { equals: q, mode: 'insensitive' } },
                { product: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { product: true },
      take: 40,
      orderBy: { product: { name: 'asc' } },
    });

    return res.json({ success: true, data: variants.map(toPosVariant) });
  } catch (err) {
    console.error('searchPosVariants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search products' });
  }
}

// POST /api/admin/pos/checkout
// body: { items: [{ variantId, quantity }], customerName?, customerPhone?, paymentMethod }
// src/controllers/pos.controller.js — checkoutPos (full replacement)
async function checkoutPos(req, res) {
  try {
    const { items, customerName, customerPhone, paymentMethod } = req.body;
    const discountAmount = req.body.discountAmount ? Number(req.body.discountAmount) : 0;
    const taxRate = req.body.taxRate ? Number(req.body.taxRate) : 0;
    const amountReceived = req.body.amountReceived != null ? Number(req.body.amountReceived) : null;

    const errors = validatePosCheckoutInput({ items, paymentMethod, discountAmount, taxRate });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const adminId = req.user.id;

    const order = await prisma.$transaction(async (tx) => {
      const merged = new Map();
      for (const { variantId, quantity } of items) {
        merged.set(variantId, (merged.get(variantId) || 0) + quantity);
      }

      const variantIds = [...merged.keys()];
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      if (variants.length !== variantIds.length) {
        const err = new Error('One or more items no longer exist');
        err.statusCode = 400;
        throw err;
      }

      for (const variant of variants) {
        const qty = merged.get(variant.id);
        if (qty > variant.stockQuantity) {
          const err = new Error(
            `${variant.product.name} (${variant.size}, ${variant.color}) has only ${variant.stockQuantity} left in stock`
          );
          err.statusCode = 400;
          throw err;
        }
      }

      // ដំណោះស្រាយ៖ ត្រលប់មកប្រើ for...of វិញ ដើម្បីជៀសវាងការស្ទះ Connection (Overload)
      for (const variant of variants) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stockQuantity: { decrement: merged.get(variant.id) } },
        });
      }

      const subtotalAmount = variants.reduce(
        (sum, v) => sum + Number(v.product.price) * merged.get(v.id),
        0
      );

      const safeDiscount = Math.min(discountAmount, subtotalAmount);
      const taxableAmount = subtotalAmount - safeDiscount;
      const taxAmount = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
      const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

      const orderNumber = await generateOrderNumber(tx);

      return tx.order.create({
        data: {
          userId: adminId,
          orderNumber,
          subtotalAmount,
          discountAmount: safeDiscount,
          taxRate,
          taxAmount,
          totalAmount,
          status: 'delivered',
          shippingAddress: customerName ? `In-store (POS) — ${customerName}` : 'In-store (POS)',
          phone: customerPhone || 'N/A',
          paymentMethod,
          amountReceived: paymentMethod === 'cash' ? amountReceived : null,
          changeDue:
            paymentMethod === 'cash' && amountReceived != null
              ? Math.round((amountReceived - totalAmount) * 100) / 100
              : null,
          items: {
            create: variants.map((v) => ({
              variantId: v.id,
              productNameSnapshot: v.product.name,
              sizeSnapshot: v.size,
              colorSnapshot: v.color,
              quantity: merged.get(v.id),
              unitPrice: v.product.price,
            })),
          },
        },
        include: { items: true, user: true },
      });
    }, {
      maxWait: 5000,
      timeout: 15000, // នៅរក្សា 15 វិនាទីដដែល
    });

    return res.status(201).json({ success: true, data: toAdminOrderDetail(order) });
  } catch (err) {
    console.error('checkoutPos error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Checkout failed' : err.message,
    });
  }
}

module.exports = { searchPosVariants, checkoutPos };