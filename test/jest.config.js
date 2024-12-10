import path from 'path'
import { fileURLToPath } from 'url'
import jestBaseConfig from '../jest.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** @type {import('jest').Config} */
const customJestConfig = {
  ...jestBaseConfig,
  testMatch: ['<rootDir>/**/*int.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  globalSetup: path.resolve(dirname, './helpers/startMemoryDB.ts'),
  globalTeardown: path.resolve(dirname, './helpers/stopMemoryDB.ts'),

  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/helpers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default customJestConfig
