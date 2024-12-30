import baseConfig from '../../jest.config.js'

/** @type {import('jest').Config} */
const customJestConfig = {
  ...baseConfig,
  setupFilesAfterEnv: null,
  testMatch: ['**/src/**/?(*.)+(spec|test|it-test).[tj]s?(x)'],
  testTimeout: 20000,
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        $schema: 'https://json.schemastore.org/swcrc',
        sourceMaps: true,
        exclude: ['/**/mocks'],
        jsc: {
          target: 'esnext',
          parser: {
            syntax: 'typescript',
            tsx: true,
            dts: true,
          },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
}

export default customJestConfig
