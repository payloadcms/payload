import { existsSync, promises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getNextRootDir } from './helpers/getNextRootDir.js'

const { rm } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const createTestHooks = (testSuiteName = '_community', testSuiteConfig = 'config.ts') => {
  const rootDir = getNextRootDir().rootDir

  return {
    /**
     * Clear next webpack cache and set 'PAYLOAD_CONFIG_PATH' environment variable
     */
    beforeTest: async () => {
      // Delete entire .next cache folder
      const nextCache = path.resolve(rootDir, './.next')
      if (existsSync(nextCache)) {
        await rm(nextCache, { recursive: true })
      }

      process.env.PAYLOAD_CONFIG_PATH =
        process.env.PAYLOAD_TEST_PROD === 'true'
          ? path.resolve(rootDir, testSuiteName, testSuiteConfig)
          : path.resolve(dirname, testSuiteName, testSuiteConfig)
    },
  }
}
