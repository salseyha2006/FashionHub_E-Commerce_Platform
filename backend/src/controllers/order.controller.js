// src/controllers/order.controller.js
const prisma = require('../config/db');
const {
  validateOrderInput,
  validateStatusInput,
  isValidTransition,
} = require('../utils/validators');
const {
  toOrderDetail,
  toOrderSummary,
  toAdminOrderSummary,
  toAdminOrderDetail,
} = require('../utils/serializers');
const { generateOrderNumber } = require('../utils/orderNumber');

async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const { shippingAddress, phone, paymentMethod } = req.body;

    const errors = validateOrderInput({ shippingAddress, phone, paymentMethod });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const order = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { variant: { include: { product: true } } },
      });

      if (cartItems.length === 0) {
        // Thrown errors inside $transaction abort the whole transaction
        // and propagate out to the outer catch block below.
        const err = new Error('Cart is empty');
        err.statusCode = 400;
        throw err;
      }

      // Re-check stock server-side — cart quantities may be stale if
      // another order depleted stock since the item was added.
      for (const item of cartItems) {
        if (item.quantity > item.variant.stockQuantity) {
          const err = new Error(
            `${item.variant.product.name} (${item.variant.size}, ${item.variant.color}) has only ${item.variant.stockQuantity} left in stock`
          );
          err.statusCode = 400;
          throw err;
        }
      }

      // Decrement stock for each variant
      for (const item of cartItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.variant.product.price) * item.quantity,
        0
      );

      const orderNumber = await generateOrderNumber(tx);

      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          totalAmount: Number(totalAmount.toFixed(2)),
          status: 'pending',
          shippingAddress: shippingAddress.trim(),
          phone: phone.trim(),
          paymentMethod,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              productNameSnapshot: item.variant.product.name,
              sizeSnapshot: item.variant.size,
              colorSnapshot: item.variant.color,
              quantity: item.quantity,
              unitPrice: item.variant.product.price,
            })),
          },
        },
        include: { items: true },
      });

      // Clear the cart now that the order has been placed
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    return res.status(201).json({ success: true, data: toOrderDetail(order) });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('Create order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}

async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: orders.map(toOrderSummary) });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
}

async function getMyOrderById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: toOrderDetail(order) });
  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
}

async function getAllOrdersAdmin(req, res) {
  try {
    const { status, search, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    // Every active filter is AND-ed together; search itself is an OR across
    // the three fields a cashier is likely to have on hand — the invoice
    // number, the customer's phone, or their name.
    const clauses = [];
    if (status) clauses.push({ status });

    if (search && search.trim()) {
      const q = search.trim();
      clauses.push({
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (dateFrom || dateTo) {
      const createdAt = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lt = new Date(dateTo);
      clauses.push({ createdAt });
    }

    const where = clauses.length > 0 ? { AND: clauses } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders: orders.map(toAdminOrderSummary),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
}

async function getOrderByIdAdmin(req, res) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: toAdminOrderDetail(order) });
  } catch (err) {
    console.error('Get admin order error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const errors = validateStatusInput({ status });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isValidTransition(existing.status, status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return res.status(200).json({ success: true, data: toOrderDetail(order) });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
};