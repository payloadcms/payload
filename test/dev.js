/* eslint-disable @typescript-eslint/no-var-requires */
const minimist = require('minimist')
const path = require('path')
const { nextDev } = require(path.resolve(__dirname, '..', 'node_modules/next/dist/cli/next-dev'))
const fs = require('fs')
const { readFile } = require('fs').promises
const { writeFile } = require('fs').promises
const { rm } = require('fs').promises
const JSON5 = require('json5')

main()

async function main() {
  const {
    _: [testSuiteArg],
    ...args
  } = minimist(process.argv.slice(2))

  if (args.turbo !== false) {
    process.env.TURBOPACK = '1'
  }

  const testSuite = testSuiteArg || '_community'

  console.log('\nUsing config:', testSuite, '\n')

  // Delete next webpack cache
  const nextWebpackCache = path.resolve(__dirname, '..', '.next/cache/webpack')
  if (fs.existsSync(nextWebpackCache)) {
    await rm(nextWebpackCache, { recursive: true })
  }

  // Set path.'payload-config' in tsconfig.json
  const tsConfigPath = path.resolve(__dirname, '..', 'tsconfig.json')
  const tsConfig = await JSON5.parse(await readFile(tsConfigPath, 'utf8'))
  tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuite}/config.ts`]
  await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

  const PAYLOAD_CONFIG_PATH = path.resolve(testSuite, 'config')
  process.env.PAYLOAD_CONFIG_PATH = PAYLOAD_CONFIG_PATH

  nextDev({ _: [path.resolve(__dirname, '..')] })
}
