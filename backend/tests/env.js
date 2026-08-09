// tests/env.js
// Loaded via jest.config.js "setupFiles" (runs before any test file or
// helper is required) so DATABASE_URL etc. are set before the Prisma
// client in src/config/db.js is instantiated, no matter which module
// happens to import it first.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
