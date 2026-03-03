import { existsSync, promises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { replacePayloadConfigPath } from '../scripts/replacePayloadConfigPath.js'
import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'

const { rm } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const createTestHooks = (testSuiteName = '_community', testSuiteConfig = 'config.ts') => {
  const rootDir = getNextRootDir().rootDir

  return {
    /**
     * Clear next webpack cache and set '@payload-config' path in tsconfig.json
     */
    beforeTest: async () => {
      // Delete entire .next cache folder
      const nextCache = path.resolve(rootDir, './.next')
      if (existsSync(nextCache)) {
        await rm(nextCache, { recursive: true })
      }

      const configPath =
        process.env.PAYLOAD_TEST_PROD === 'true'
          ? `./${testSuiteName}/${testSuiteConfig}`
          : `./test/${testSuiteName}/${testSuiteConfig}`

      await replacePayloadConfigPath(rootDir, configPath)

      process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, testSuiteName, testSuiteConfig)
    },
  }
}
