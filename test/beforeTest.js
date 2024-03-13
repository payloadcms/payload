/* eslint-disable @typescript-eslint/no-var-requires */
import { promises as __promises, promises as _promises, existsSync, promises } from 'fs'
import json5 from 'json5'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const { readFile } = promises
const { writeFile } = _promises
const { rm } = __promises
const { parse } = json5

export const beforeTest = async (testSuiteName) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const testSuite = testSuiteName || '_community'

  console.log('\nUsing config:', testSuite, '\n')

  // Delete next webpack cache
  const nextWebpackCache = resolve(__dirname, '..', '.next/cache/webpack')
  if (existsSync(nextWebpackCache)) {
    await rm(nextWebpackCache, { recursive: true })
  }

  // Set path.'payload-config' in tsconfig.json
  const tsConfigPath = resolve(__dirname, '..', 'tsconfig.json')
  const tsConfig = await parse(await readFile(tsConfigPath, 'utf8'))
  tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuite}/config.ts`]

  await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

  const PAYLOAD_CONFIG_PATH = resolve(testSuite, 'config')
  process.env.PAYLOAD_CONFIG_PATH = PAYLOAD_CONFIG_PATH
}
