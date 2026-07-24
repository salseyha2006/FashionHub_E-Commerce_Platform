// backend/src/controllers/dashboard.controller.js — NEW
const prisma = require('../config/db');

const LOW_STOCK_THRESHOLD = 5;

async function getDashboardStats(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [todayOrders, recentOrdersRaw, lowStockVariants, monthlyOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday }, status: { not: 'cancelled' } },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.productVariant.findMany({
        where: { stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
        include: { product: { select: { id: true, name: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsAgo }, status: { not: 'cancelled' } },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Group monthly totals in JS (avoids raw SQL, dataset is small for a project of this size)
    const monthlyMap = {};
    for (const o of monthlyOrders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + Number(o.totalAmount);
    }
    const monthlySales = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));

    const lowStockItems = lowStockVariants.map((v) => ({
      productId: v.product.id,
      productName: v.product.name,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
    }));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      customerName: o.user?.name || null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        ordersToday: todayOrders.length,
        lowStockCount: lowStockItems.length,
        monthlySales,
        lowStockItems,
        recentOrders,
      },
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
  }
}

module.exports = { getDashboardStats };