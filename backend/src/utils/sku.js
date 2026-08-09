// src/utils/sku.js
// Auto-generates a SKU/barcode for a product variant when the admin leaves
// the field blank. Manually-entered SKUs (e.g. from a supplier's own
// barcode) always take priority — this only fills the gap so every variant
// is scannable in POS, not just the ones someone typed a code in for.
const prisma = require('../config/db');

// No 0/O/1/I — visually ambiguous characters that are easy to misread or
// mis-scan, especially on a printed barcode label.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 5) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Two-letter prefix from the product name (e.g. "Hoodie" -> "HO"), falling
// back to "PR" for names with no usable letters.
function prefixFromName(name) {
  const letters = (name || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 2) || 'PR').padEnd(2, 'X');
}

// Generates one unique SKU, checked against the database. `usedInBatch`
// guards against two variants in the same request picking the same
// not-yet-saved candidate.
async function generateSku(name, usedInBatch = new Set()) {
  const prefix = prefixFromName(name);

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${prefix}-${randomSuffix()}`;
    if (usedInBatch.has(candidate)) continue;
    const existing = await prisma.productVariant.findUnique({ where: { sku: candidate } });
    if (!existing) {
      usedInBatch.add(candidate);
      return candidate;
    }
  }

  // Astronomically unlikely fallback — still unique in practice.
  const fallback = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  usedInBatch.add(fallback);
  return fallback;
}

// Takes the raw variant inputs from a create/update request and returns
// variant data ready for Prisma, filling in `sku` for any variant that
// doesn't already have one (blank, whitespace-only, or omitted).
async function attachSkusToVariants(productName, variants) {
  const usedInBatch = new Set();
  const result = [];
  for (const v of variants) {
    const typed = typeof v.sku === 'string' ? v.sku.trim() : '';
    const sku = typed || (await generateSku(productName, usedInBatch));
    result.push({
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
      sku,
    });
  }
  return result;
}

module.exports = { generateSku, attachSkusToVariants };