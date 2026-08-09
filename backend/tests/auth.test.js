// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { cleanDatabase, createUser } = require('./helpers/db');

beforeEach(async () => {
  await cleanDatabase();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token + public user (no password hash)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sophea Kim',
      email: 'sophea@example.com',
      password: 'password123',
      phone: '012345678',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('sophea@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('normalizes email to lowercase before storing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dara',
      email: 'Dara@EXAMPLE.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('dara@example.com');
  });

  it('rejects registration with a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: '1234',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with an invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration when the email is already registered', async () => {
    await createUser({ email: 'existing@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'existing@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns a token', async () => {
    await createUser({ email: 'login@example.com', password: 'correct-password' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'correct-password',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('rejects login with the wrong password', async () => {
    await createUser({ email: 'login2@example.com', password: 'correct-password' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('rejects login for an email that is not registered', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'whatever123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
