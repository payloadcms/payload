import chalk from 'chalk'
import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import open from 'open'
import { loadEnv } from 'payload/node'

import { getNextRootDir } from './helpers/getNextRootDir.js'
import { runInit } from './runInit.js'
import { createTestHooks } from './testHooks.js'

const prod = process.argv.includes('--prod')
process.argv = process.argv.filter((arg) => arg !== '--prod')
if (prod) {
  process.env.PAYLOAD_TEST_PROD = 'true'
}

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE === 'false' ? 'false' : 'true'

const {
  _: [testSuiteArg],
  ...args
} = minimist(process.argv.slice(2))

if (!fs.existsSync(path.resolve(dirname, '../test/', testSuiteArg))) {
  console.log(chalk.red(`ERROR: The test folder "${testSuiteArg}" does not exist`))
  process.exit(0)
}

if (args.turbo === true) {
  process.env.TURBOPACK = '1'
}

const { beforeTest } = await createTestHooks(testSuiteArg)
await beforeTest()

const { adminRoute, rootDir } = getNextRootDir(testSuiteArg)

await runInit(testSuiteArg, true)

// Open the admin if the -o flag is passed
if (args.o) {
  await open(`http://localhost:3000${adminRoute}`)
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000

await nextDev({ port }, 'default', rootDir)

// fetch the admin url to force a render
void fetch(`http://localhost:${port}${adminRoute}`)

// This ensures that the next-server process is killed when this process is killed and doesn't linger around.
process.on('SIGINT', function () {
  process.exit(0)
})
