module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globalSetup: '<rootDir>/src/tests/globalSetup.js',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js',
  testTimeout: 15000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/mocks/emptyModule.js',
  },
};
