module.exports = {
  verbose: true,
  testTimeout: 15000,
  testRegex: '(/src/admin/.*\\.(test|spec))\\.[jt]sx?$',
  setupFilesAfterEnv: ['<rootDir>/test/components/globalSetup.js'],
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/webpack/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/webpack/mocks/emptyModule.js',
  },
};
