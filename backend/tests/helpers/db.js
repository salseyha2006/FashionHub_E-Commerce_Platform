// tests/helpers/db.js
// Shared helpers for setting up/tearing down test data.
// IMPORTANT: tests run against the database pointed to by DATABASE_URL
// (see .env.test.example) — never point this at your real/production DB.
const bcrypt = require('bcrypt');
const prisma = require('../../src/config/db');

// Deletes rows in FK-safe order (children before parents).
// Only touches tables these tests actually use.
async function cleanDatabase() {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
}

async function createUser({
  name = 'Test User',
  email = 'test@example.com',
  password = 'password123',
  role = 'customer',
} = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email, passwordHash, role },
  });
}

// Creates a category -> product -> single variant with a given stock level.
// Returns { category, product, variant } for use in order tests.
async function createProductWithVariant({
  categoryName = 'Test Category',
  productName = 'Test Product',
  price = 19.99,
  size = 'M',
  color = 'Black',
  stockQuantity = 2,
} = {}) {
  const category = await prisma.category.create({
    data: { name: categoryName, slug: `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: productName,
      price,
      images: [],
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      size,
      color,
      stockQuantity,
    },
  });

  return { category, product, variant };
}

async function addToCart(userId, variantId, quantity) {
  return prisma.cartItem.create({
    data: { userId, variantId, quantity },
  });
}

module.exports = {
  prisma,
  cleanDatabase,
  createUser,
  createProductWithVariant,
  addToCart,
};
