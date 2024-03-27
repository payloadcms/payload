import { existsSync, promises } from 'fs'
import json5 from 'json5'
import path from 'path'
import { fileURLToPath } from 'url'

const { readFile, writeFile, rm } = promises
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const createTestHooks = async (testSuiteName = '_community') => {
  const tsConfigPath = path.resolve(dirname, '../tsconfig.json')
  const tsConfig = await json5.parse(await readFile(tsConfigPath, 'utf8'))
  const originalPayloadConfigTsValue =
    tsConfig.compilerOptions.paths['@payload-config'] ?? './_community/config.ts'

  return {
    /**
     * Clear next webpack cache and set '@payload-config' path in tsconfig.json
     */
    beforeTest: async () => {
      // Delete next webpack cache
      const nextWebpackCache = path.resolve(dirname, '../.next/cache/webpack')
      if (existsSync(nextWebpackCache)) {
        await rm(nextWebpackCache, { recursive: true })
      }

      // Set '@payload-config' in tsconfig.json
      tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuiteName}/config.ts`]
      await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

      const PAYLOAD_CONFIG_PATH = path.resolve(testSuiteName, 'config')
      process.env.PAYLOAD_CONFIG_PATH = PAYLOAD_CONFIG_PATH
    },
    /**
     * Reset the changes made to tsconfig.json
     */
    afterTest: async () => {
      // Set original value of '@payload-config' back to default of _community
      tsConfig.compilerOptions.paths['@payload-config'] = ['./test/_community/config.ts']

      await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2) + '\n')
    },
  }
}
