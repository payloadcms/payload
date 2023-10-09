module.exports = {
  verbose: true,
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/test/**/*int.spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  globalSetup: './test/jest.setup.ts',
  testTimeout: 90000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/bundlers/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/bundlers/mocks/emptyModule.js',
  },
};
