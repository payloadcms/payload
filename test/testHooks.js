// @ts-check

import { existsSync, promises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { rm } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const createTestHooks = async (testSuiteName = '_community') => {
  return {
    /**
     * Clear next webpack cache and set '@payload-config' path in tsconfig.json
     */
    beforeTest: async () => {
      // Delete entire .next cache folder
      const nextCache = path.resolve(dirname, '../.next')
      if (existsSync(nextCache)) {
        await rm(nextCache, { recursive: true })
      }

      process.env.PAYLOAD_CONFIG_PATH = path.resolve(testSuiteName, 'config')
    },
  }
}
