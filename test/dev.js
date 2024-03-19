import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { createTestHooks } from './testHooks.js'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

process.env.PAYLOAD_DROP_DATABASE = 'true'

const {
  _: [testSuiteArg],
  ...args
} = minimist(process.argv.slice(2))

if (args.turbo === true) {
  process.env.TURBOPACK = '1'
}

process.env.PAYLOAD_DROP_DATABASE = 'true'

const { afterTest, beforeTest } = await createTestHooks(testSuiteArg)
await beforeTest()

// @ts-expect-error
await nextDev({ _: [resolve(_dirname, '..')], port: process.env.PORT || 3000 })

// On cmd+c, clean up
process.on('SIGINT', async () => {
  await afterTest()
  process.exit(0)
})
