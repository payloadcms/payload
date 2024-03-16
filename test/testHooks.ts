import { existsSync, promises } from 'fs'
import json5 from 'json5'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const { readFile, writeFile, rm } = promises
const { parse } = json5

type TestHooks = {
  afterTest: () => Promise<void>
  beforeTest: () => Promise<void>
}

export const createTestHooks = async (testSuiteName = '_community'): Promise<TestHooks> => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  console.log('\nUsing config:', testSuiteName, '\n')

  const tsConfigPath = resolve(__dirname, '..', 'tsconfig.json')
  const tsConfig = await parse(await readFile(tsConfigPath, 'utf8'))
  const originalPayloadConfigTsValue =
    tsConfig.compilerOptions.paths['@payload-config'] ?? './test/_community/config.ts'

  return {
    /**
     * Clear next webpack cache and set '@payload-config' path in tsconfig.json
     */
    beforeTest: async () => {
      // Delete next webpack cache
      const nextWebpackCache = resolve(__dirname, '..', '.next/cache/webpack')
      if (existsSync(nextWebpackCache)) {
        await rm(nextWebpackCache, { recursive: true })
      }

      // Set '@payload-config' in tsconfig.json
      tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuiteName}/config.ts`]
      await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

      const PAYLOAD_CONFIG_PATH = resolve(testSuiteName, 'config')
      process.env.PAYLOAD_CONFIG_PATH = PAYLOAD_CONFIG_PATH
    },
    /**
     * Reset the changes made to tsconfig.json
     */
    afterTest: async () => {
      // Revert the changes made to tsconfig.json
      tsConfig.compilerOptions.paths['@payload-config'] = originalPayloadConfigTsValue

      await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2) + '\n')
    },
  }
}
