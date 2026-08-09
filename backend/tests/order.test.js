// tests/order.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const {
  prisma,
  cleanDatabase,
  createUser,
  createProductWithVariant,
  addToCart,
} = require('./helpers/db');

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

let user;
let authHeader;

beforeEach(async () => {
  await cleanDatabase();
  user = await createUser({ email: 'shopper@example.com' });
  authHeader = `Bearer ${tokenFor(user)}`;
});

describe('POST /api/orders', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/orders').send({
      shippingAddress: '123 Street',
      phone: '012345678',
      paymentMethod: 'cod',
    });

    expect(res.status).toBe(401);
  });

  it('rejects order creation when the cart is empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        shippingAddress: '123 Street, Phnom Penh',
        phone: '012345678',
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it('rejects the order when requested quantity exceeds available stock, and leaves stock unchanged', async () => {
    // Stock edge case: only 2 in stock, cart requests 5.
    const { variant } = await createProductWithVariant({ stockQuantity: 2 });
    await addToCart(user.id, variant.id, 5);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        shippingAddress: '123 Street, Phnom Penh',
        phone: '012345678',
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only 2 left in stock/i);

    // The whole transaction must have rolled back — stock should be untouched,
    // and no order should have been created.
    const unchangedVariant = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(unchangedVariant.stockQuantity).toBe(2);

    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    expect(orderCount).toBe(0);
  });

  it('succeeds when requested quantity exactly matches available stock (boundary case), and depletes it to zero', async () => {
    const { variant } = await createProductWithVariant({ stockQuantity: 2, price: 10 });
    await addToCart(user.id, variant.id, 2);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        shippingAddress: '123 Street, Phnom Penh',
        phone: '012345678',
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAmount).toBeDefined();

    const depletedVariant = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(depletedVariant.stockQuantity).toBe(0);

    // Cart should be cleared after a successful order.
    const remainingCartItems = await prisma.cartItem.count({ where: { userId: user.id } });
    expect(remainingCartItems).toBe(0);
  });

  it('creates an order with the correct total and clears the cart on success', async () => {
    const { variant } = await createProductWithVariant({ stockQuantity: 10, price: 15.5 });
    await addToCart(user.id, variant.id, 3);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        shippingAddress: '456 Riverside Blvd',
        phone: '098765432',
        paymentMethod: 'bank_transfer',
      });

    expect(res.status).toBe(201);

    const order = await prisma.order.findFirst({ where: { userId: user.id }, include: { items: true } });
    expect(order).not.toBeNull();
    expect(Number(order.totalAmount)).toBeCloseTo(46.5); // 15.50 * 3
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);

    const remainingStock = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(remainingStock.stockQuantity).toBe(7); // 10 - 3
  });

  it('rejects order creation with a missing shippingAddress', async () => {
    const { variant } = await createProductWithVariant({ stockQuantity: 5 });
    await addToCart(user.id, variant.id, 1);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        phone: '012345678',
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(400);
  });
});
