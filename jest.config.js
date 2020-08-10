module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globalSetup: '<rootDir>/src/tests/globalSetup.js',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js',
  testTimeout: 15000,
};
