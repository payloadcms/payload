import nextEnvImport from '@next/env'
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
import { child } from './safelyRunScript.js'
import { createTestHooks } from './testHooks.js'

// @todo remove in 4.0 - will behave like this by default in 4.0
process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY = 'true'

const prod = process.argv.includes('--prod')
if (prod) {
  process.argv = process.argv.filter((arg) => arg !== '--prod')
  process.env.PAYLOAD_TEST_PROD = 'true'
}

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const {
  _: [_testSuiteArg = '_community'],
  ...args
} = minimist(process.argv.slice(2))

let testSuiteArg: string | undefined
let testSuiteConfigOverride: string | undefined
if (_testSuiteArg.includes('#')) {
  ;[testSuiteArg, testSuiteConfigOverride] = _testSuiteArg.split('#')
} else {
  testSuiteArg = _testSuiteArg
}

if (!testSuiteArg || !fs.existsSync(path.resolve(dirname, testSuiteArg))) {
  console.log(chalk.red(`ERROR: The test folder "${testSuiteArg}" does not exist`))
  process.exit(0)
}

// TODO: Re-enable Turbopack once Next.js fixes server-external-packages.json bug
// Issue: Next.js 16.1.2 renamed the file to .jsonc but Turbopack still looks for .json
// Tracking: https://github.com/vercel/next.js/issues/...
let enableTurbo = false

if (enableTurbo === false) {
  console.log(chalk.yellow('⚠️  Turbopack disabled for Next.js 16 compatibility testing'))
}

if (['admin-root'].includes(testSuiteArg)) {
  console.log(
    chalk.yellow(
      `The "${testSuiteArg}" test directory is not compatible with turbopack, using webpack instead.`,
    ),
  )
  enableTurbo = false
}

console.log(`Selected test suite: ${testSuiteArg}${enableTurbo ? ' [Turbopack]' : ' [Webpack]'}`)

if (enableTurbo) {
  process.env.TURBOPACK = '1'
}

const { beforeTest } = await createTestHooks(testSuiteArg, testSuiteConfigOverride)
await beforeTest()

const { rootDir, adminRoute } = getNextRootDir(testSuiteArg)

await runInit(testSuiteArg, true)

// This is needed to forward the environment variables to the next process that were created after loadEnv()
// for example process.env.DATABASE_URL otherwise app.prepare() will clear them
nextEnvImport.updateInitialEnv(process.env)

// Open the admin if the -o flag is passed
if (args.o) {
  await open(`http://localhost:3000${adminRoute}`)
}

const findOpenPort = (startPort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(startPort, () => {
      console.log(`✓ Running on port ${startPort}`)
      server.close(() => resolve(startPort))
    })
    server.on('error', () => {
      console.log(`⚠ Port ${startPort} is in use, trying ${startPort + 1} instead.`)
      findOpenPort(startPort + 1)
        .then(resolve)
        .catch(reject)
    })
  })
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000

const availablePort = await findOpenPort(port)

// Assign the available port to process.env.PORT so that the next and our HMR server uses it
// @ts-expect-error - PORT is a string from somewhere
process.env.PORT = availablePort

// @ts-expect-error the same as in test/helpers/initPayloadE2E.ts
const app = nextImport({
  dev: true,
  hostname: 'localhost',
  port: availablePort,
  dir: rootDir,
  turbo: enableTurbo,
  turbopack: enableTurbo,
})

const handle = app.getRequestHandler()

let resolveServer: () => void

const serverPromise = new Promise<void>((res) => (resolveServer = res))

void app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url || '', true)
    await handle(req, res, parsedUrl)
  }).listen(availablePort, () => {
    resolveServer()
  })
})

await serverPromise
process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE === 'false' ? 'false' : 'true'

// fetch the admin url to force a render
void fetch(`http://localhost:${availablePort}${adminRoute}`)
void fetch(`http://localhost:${availablePort}/api/access`)
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
