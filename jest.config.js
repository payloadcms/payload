const customJestConfig = {
  globalSetup: './test/jest.setup.ts',
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/packages/payload/src/bundlers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/packages/payload/src/bundlers/mocks/fileMock.js',
    'payload-config': '<rootDir>/__mocks__/payload-config.ts',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/payload/src/**/*.spec.ts', '<rootDir>/test/**/*int.spec.ts'],
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}

module.exports = customJestConfig
