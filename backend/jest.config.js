module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/env.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
  // Run test files serially — they share one test database and reset it
  // between tests, so parallel workers would step on each other.
  maxWorkers: 1,
  verbose: true,
};
