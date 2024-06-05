/** @type {import('jest').Config} */ const baseJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFiles: ['<rootDir>/test/jest.setup.env.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/test/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/helpers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/*/src/**/*.spec.ts'],
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}

if (process.env.CI) {
  baseJestConfig.reporters = [['github-actions', { silent: false }], 'summary']
}

export default baseJestConfig
