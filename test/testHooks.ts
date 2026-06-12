import { existsSync, promises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'

const { readFile, rm, writeFile } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Replace the @payload-config path in tsconfig.base.json using string replacement
 * to avoid reformatting the entire file.
 */
async function replacePayloadConfigPath(rootDir: string, configPath: string) {
  const tsConfigBasePath = path.resolve(rootDir, './tsconfig.base.json')
  const tsConfigPath = existsSync(tsConfigBasePath)
    ? tsConfigBasePath
    : path.resolve(rootDir, './tsconfig.json')

  const content = await readFile(tsConfigPath, 'utf8')
  const updated = content.replace(
    /("@payload-config":\s*\[\s*)"[^"]*"(\s*\])/,
    `$1"${configPath}"$2`,
  )
  await writeFile(tsConfigPath, updated)
}

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
