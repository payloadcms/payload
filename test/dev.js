/* eslint-disable @typescript-eslint/no-var-requires */
import { existsSync } from 'fs'
import { promises } from 'fs'
import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import { dirname } from 'path'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
const { readFile } = promises
import { promises as _promises } from 'fs'
const { writeFile } = _promises
import { promises as __promises } from 'fs'
const { rm } = __promises
import json5 from 'json5'

const { parse } = json5

main()

async function main() {
  const {
    _: [testSuiteArg],
    ...args
  } = minimist(process.argv.slice(2))

  if (args.turbo !== false) {
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
