import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import open from 'open'
import { getNextJSRootDir } from './helpers/getNextJSRootDir.js'

import { createTestHooks } from './testHooks.js'

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

const rootDir = getNextJSRootDir(testSuiteArg)

// Open the admin if the -o flag is passed
if (args.o) {
  await open('http://localhost:3000/admin')
}

// @ts-expect-error
await nextDev({ port: process.env.PORT || 3000, dirname: rootDir }, 'default', rootDir)

// On cmd+c, clean up
process.on('SIGINT', async () => {
  await afterTest()
  process.exit(0)
})

// fetch the admin url to force a render
fetch(`http://localhost:${process.env.PORT || 3000}/admin`)
