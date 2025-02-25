import { parse, stringify } from 'comment-json'
import { existsSync, promises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getNextRootDir } from './helpers/getNextRootDir.js'

const { readFile, writeFile, rm } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const createTestHooks = async (
  testSuiteName = '_community',
  testSuiteConfig = 'config.ts',
) => {
  const rootDir = getNextRootDir().rootDir
  const tsConfigBasePath = path.resolve(rootDir, './tsconfig.base.json')
  const tsConfigPath = existsSync(tsConfigBasePath)
    ? tsConfigBasePath
    : path.resolve(rootDir, './tsconfig.json')

  const tsConfigContent = await readFile(tsConfigPath, 'utf8')
  const tsConfig = parse(tsConfigContent)

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

      // Set '@payload-config' in tsconfig.json

      // @ts-expect-error
      tsConfig.compilerOptions.paths['@payload-config'] = [
        process.env.PAYLOAD_TEST_PROD === 'true'
          ? `./${testSuiteName}/${testSuiteConfig}`
          : `./test/${testSuiteName}/${testSuiteConfig}`,
      ]
      await writeFile(tsConfigPath, stringify(tsConfig, null, 2) + '\n')

      process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, testSuiteName, testSuiteConfig)
    },
  }
}
