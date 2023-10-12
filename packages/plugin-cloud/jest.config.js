module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  verbose: true,
  // globalSetup: './test/jest.setup.ts',
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/src/webpack/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/webpack/mocks/fileMock.js',
  },
  testTimeout: 60000,
}
