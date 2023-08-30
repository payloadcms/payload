/** @type {import('jest').Config} */
export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/src/bundlers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/bundlers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/componentsSetup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['node_modules', 'dist'],
  testRegex: '(/src/admin/.*\\.(test|spec))\\.[jt]sx?$',
  testTimeout: 15000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}
