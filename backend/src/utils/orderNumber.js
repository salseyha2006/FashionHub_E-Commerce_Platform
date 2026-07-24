// src/utils/orderNumber.js
const prisma = require('../config/db');

// Generates "FH-2026-0042" — prefix, year, zero-padded sequence within that year.
// Must be called inside the same transaction as order creation to avoid race conditions.
async function generateOrderNumber(tx, year = new Date().getFullYear()) {
  const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
  const startOfNextYear = new Date(`${year + 1}-01-01T00:00:00Z`);

  const countThisYear = await tx.order.count({
    where: {
      createdAt: { gte: startOfYear, lt: startOfNextYear },
    },
  });

  const sequence = String(countThisYear + 1).padStart(4, '0');
  return `FH-${year}-${sequence}`;
}

module.exports = { generateOrderNumber };