module.exports = {
  verbose: true,
  testTimeout: 15000,
  testEnvironment: 'jsdom',
  testRegex: '(/src/admin/.*\\.(test|spec))\\.[jt]sx?$',
  setupFilesAfterEnv: ['<rootDir>/test/componentsSetup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/bundlers/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/bundlers/mocks/emptyModule.js',
  },
};
