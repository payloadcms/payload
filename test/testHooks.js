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

      // Set '@payload-config' in tsconfig.json
      tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuiteName}/config.ts`]
      await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

      process.env.PAYLOAD_CONFIG_PATH = path.resolve(testSuiteName, 'config')
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
