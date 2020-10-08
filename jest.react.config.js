module.exports = {
  verbose: true,
  testTimeout: 15000,
  testRegex: '(/src/client/.*\\.(test|spec))\\.[jt]sx?$',
  setupFilesAfterEnv: ['<rootDir>/tests/client/globalSetup.js'],
};
