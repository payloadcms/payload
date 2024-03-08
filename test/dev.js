/* eslint-disable @typescript-eslint/no-var-requires */
import { existsSync, promises, promises as _promises, promises as __promises } from 'fs'
import json5 from 'json5'
import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const { readFile } = promises
const { writeFile } = _promises
const { rm } = __promises

const { parse } = json5

main()

process.env.PAYLOAD_DROP_DATABASE = true

async function main() {
  const {
    _: [testSuiteArg],
    ...args
  } = minimist(process.argv.slice(2))

  if (args.turbo === true) {
    process.env.TURBOPACK = '1'
  }

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const testSuite = testSuiteArg || '_community'

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

  nextDev({ _: [resolve(__dirname, '..')], port: process.env.PORT || 3000 })
}
