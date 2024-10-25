import chalk from 'chalk'
import { createServer } from 'http'
import minimist from 'minimist'
import nextImport from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import open from 'open'
import { loadEnv } from 'payload/node'
import { parse } from 'url'

import { getNextRootDir } from './helpers/getNextRootDir.js'
import { runInit } from './runInit.js'
import { child, safelyRunScriptFunction } from './safelyRunScript.js'
import { createTestHooks } from './testHooks.js'

const prod = process.argv.includes('--prod')
process.argv = process.argv.filter((arg) => arg !== '--prod')
if (prod) {
  process.env.PAYLOAD_TEST_PROD = 'true'
}

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const {
  _: [testSuiteArg],
  ...args
} = minimist(process.argv.slice(2))

if (!fs.existsSync(path.resolve(dirname, testSuiteArg))) {
  console.log(chalk.red(`ERROR: The test folder "${testSuiteArg}" does not exist`))
  process.exit(0)
}

if (args.turbo === true) {
  process.env.TURBOPACK = '1'
}

const { beforeTest } = await createTestHooks(testSuiteArg)
await beforeTest()

const { rootDir, adminRoute } = getNextRootDir(testSuiteArg)

await safelyRunScriptFunction(runInit, 4000, testSuiteArg, true)

// Open the admin if the -o flag is passed
if (args.o) {
  await open(`http://localhost:3000${adminRoute}`)
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000

// @ts-expect-error the same as in test/helpers/initPayloadE2E.ts
const app = nextImport({
  dev: true,
  hostname: 'localhost',
  port,
  dir: rootDir,
})

const handle = app.getRequestHandler()

let resolveServer

const serverPromise = new Promise((res) => (resolveServer = res))

void app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  }).listen(port, () => {
    resolveServer()
  })
})

await serverPromise
process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE === 'false' ? 'false' : 'true'

// fetch the admin url to force a render
void fetch(`http://localhost:${port}${adminRoute}`)

// This ensures that the next-server process is killed when this process is killed and doesn't linger around.
process.on('SIGINT', () => {
  if (child) {
    child.kill('SIGINT')
  }
  process.exit(0)
})
process.on('SIGTERM', () => {
  if (child) {
    child.kill('SIGINT')
  }
  process.exit(0) // Exit the parent process
})
