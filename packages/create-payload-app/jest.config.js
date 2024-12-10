// import baseConfig from '../../jest.config.js'

// /** @type {import('@jest/types').Config} */
// const customJestConfig = {
//   ...baseConfig,
//   setupFilesAfterEnv: null,
//   testMatch: ['**/src/**/?(*.)+(spec|test|it-test).[tj]s?(x)'],
//   testTimeout: 20000,
// }

// export default customJestConfig

/** @type {import('jest').Config} */
const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/helpers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*spec.ts'],
  testTimeout: 160000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}

export default customJestConfig
