import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** @type {import('jest').Config} */
const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/helpers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
  testEnvironment: 'node',
  globalSetup: path.resolve(dirname, 'setup.ts'),
  testMatch: ['<rootDir>/**/*int.spec.ts'],
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}

export default customJestConfig
