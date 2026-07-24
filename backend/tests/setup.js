// tests/setup.js
// Runs once per test file (see jest.config.js "setupFilesAfterEach").
const { prisma } = require('./helpers/db');

afterAll(async () => {
  await prisma.$disconnect();
});
