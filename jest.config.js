module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/api/globalSetup.js',
  globalTeardown: '<rootDir>/tests/api/globalTeardown.js',
  testPathIgnorePatterns: [
    'node_modules',
    'src/admin/*',
    'dist',
  ],
  testTimeout: 15000,
};
