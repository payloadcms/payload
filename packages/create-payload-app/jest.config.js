import baseConfig from '../../jest.config.js'

/** @type {import('@jest/types').Config} */
const customJestConfig = {
  ...baseConfig,
  setupFilesAfterEnv: null,
  testMatch: ['**/src/**/?(*.)+(spec|test|it-test).[tj]s?(x)'],
  testTimeout: 20000,
}

export default customJestConfig
