module.exports = {
  verbose: true,
  testTimeout: 15000,
  testRegex: '(/src/admin/.*\\.(test|spec))\\.[jt]sx?$',
  setupFilesAfterEnv: ['<rootDir>/tests/client/globalSetup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/tests/mocks/emptyModule.js',
  },
};
