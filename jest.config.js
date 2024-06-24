/**
 * Ignores all ESM packages that make Jest mad.
 *
 * "Jest encountered an unexpected token"
 *
 * Direct packages:
 * - file-type
 */
const esModules = [
  // file-type and all dependencies: https://github.com/sindresorhus/file-type
  'file-type',
  'strtok3',
  'readable-web-to-node-stream',
  'token-types',
  'peek-readable',
].join('|')

/** @type {import('jest').Config} */
const baseJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
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
  transformIgnorePatterns: [
    `/node_modules/(?!.pnpm)(?!(${esModules})/)`,
    `/node_modules/.pnpm/(?!(${esModules.replace(/\//g, '\\+')})@)`,
  ],
  verbose: true,
}

if (process.env.CI) {
  baseJestConfig.reporters = [['github-actions', { silent: false }], 'summary']
}

export default baseJestConfig
