import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { beforeTest } from './beforeTest.js'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

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

  nextDev({ _: [resolve(_dirname, '..')], port: process.env.PORT || 3000 })
}
