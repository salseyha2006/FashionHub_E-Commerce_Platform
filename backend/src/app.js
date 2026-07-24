// src/app.js
// Builds and configures the Express app but does NOT start listening.
// Kept separate from server.js so tests (supertest) can import the app
// directly without binding a real port.
const path = require('path');
// Jest sets NODE_ENV=test automatically, so `npm test` loads .env.test
// instead of the regular .env — keeping tests off the dev/prod database.
require('dotenv').config({
  path: path.resolve(
    __dirname,
    '..',
    process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
  ),
});
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin-order.routes');
const adminDashboardRoutes = require('./routes/admin-dashboard.routes');
const bannerRoutes = require('./routes/banner.routes');
const adminBannerRoutes = require('./routes/admin-banner.routes');
const posRoutes = require('./routes/pos.routes');
const settingRoutes = require('./routes/setting.routes');
const adminSettingRoutes = require('./routes/admin-setting.routes');
const teamRoutes = require('./routes/team.routes');

const app = express();

// In production, set CORS_ORIGIN to your deployed frontend URL(s) (comma-separated)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true; // reflect any origin (fine for local dev)

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/pos', posRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin/settings', adminSettingRoutes);
app.use('/api/admin/team', teamRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

module.exports = app;
