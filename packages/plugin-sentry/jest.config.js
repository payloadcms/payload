module.exports = {
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/src/webpack/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/webpack/mocks/fileMock.js',
  },
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts'],
  testTimeout: 60000,
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  verbose: true,
}
