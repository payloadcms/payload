/* eslint-disable @typescript-eslint/no-var-requires */
const minimist = require('minimist')
const path = require('path')
const { nextDev } = require(path.resolve(__dirname, '..', 'node_modules/next/dist/cli/next-dev'))

main()

async function main() {
  const {
    _: [testSuiteArg],
    ...args
  } = minimist(process.argv.slice(2))

  if (args.turbo) {
    process.env.TURBOPACK = '1'
  }

  const testSuite = testSuiteArg || '_community'
  console.log('Using config:', testSuite, '\n')

  const PAYLOAD_CONFIG_PATH = path.resolve(testSuite, 'config')
  process.env.PAYLOAD_CONFIG_PATH = PAYLOAD_CONFIG_PATH

  nextDev({ _: [path.resolve(__dirname, '..')] })
}
