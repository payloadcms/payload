module.exports = {
  verbose: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'node_modules',
    'src/*',
    'dist',
  ],
  testTimeout: 15000,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/webpack/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/webpack/mocks/emptyModule.js',
  },
};
