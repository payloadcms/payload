import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import { resolve } from 'path'

import { beforeTest } from './beforeTest.js'

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

  beforeTest(testSuiteArg)

  nextDev({ _: [resolve(__dirname, '..')], port: process.env.PORT || 3000 })
}
