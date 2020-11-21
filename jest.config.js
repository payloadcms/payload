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
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/tests/mocks/emptyModule.js',
  },
  transform: {
    '\\.(css|less|scss)$': './tests/stub-transformer.js',
    '\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
};
