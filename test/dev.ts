import chalk from 'chalk'
import { createServer } from 'http'
import minimist from 'minimist'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import open from 'open'
import { loadEnv } from 'payload/node'

import type { DevServerResult } from './adapters/nextDevServer.js'

import { assertDbReachable } from './__helpers/shared/assertDbReachable.js'
import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'
import { getCurrentDatabaseAdapter } from './dbAdapters.js'
import { runInit } from './runInit.js'
import { child } from './safelyRunScript.js'
import { createTestHooks } from './testHooks.js'

// --dist runs the dev server against packed/built dist packages instead of src.
// --prod-server boots a real production server (next build / vite build, then serve).
// It implies --dist (packed packages + prod rootDir).
// --prod is kept as a back-compat alias for --dist (used by runE2E.ts).
const prodServer = process.argv.includes('--prod-server')
const dist = prodServer || process.argv.includes('--dist') || process.argv.includes('--prod')
if (dist) {
  process.argv = process.argv.filter(
    (arg) => arg !== '--dist' && arg !== '--prod' && arg !== '--prod-server',
  )
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

// Enable turbopack by default, unless --no-turbo is passed
let enableTurbo = args.turbo !== false

if (['admin-root'].includes(testSuiteArg)) {
  console.log(
    chalk.yellow(
      `The "${testSuiteArg}" test directory is not compatible with turbopack, using webpack instead.`,
    ),
  )
  enableTurbo = false
}

const framework = process.env.PAYLOAD_FRAMEWORK || 'next'

console.log(
  `Selected test suite: ${testSuiteArg} [${framework}]${framework === 'next' && enableTurbo ? ' [Turbopack]' : framework === 'next' ? ' [Webpack]' : ''}`,
)

if (enableTurbo && framework === 'next' && !prodServer) {
  process.env.TURBOPACK = '1'
}

await assertDbReachable(getCurrentDatabaseAdapter())

// eslint-disable-next-line @typescript-eslint/await-thenable
const { beforeTest } = await createTestHooks(testSuiteArg, testSuiteConfigOverride)
await beforeTest()

await runInit(testSuiteArg, true, false, testSuiteConfigOverride)

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

// @ts-expect-error - PORT is a string from somewhere
process.env.PORT = availablePort

let serverResult: DevServerResult

switch (framework) {
  case 'next': {
    if (prodServer) {
      const { startNextProdServer } = await import('./adapters/nextProdServer.js')
      serverResult = await startNextProdServer({
        port: availablePort,
        testSuiteArg,
      })
    } else {
      const { startNextDevServer } = await import('./adapters/nextDevServer.js')
      serverResult = await startNextDevServer({
        enableTurbo,
        port: availablePort,
        testSuiteArg,
      })
    }
    break
  }
  case 'tanstack-start': {
    if (prodServer) {
      const { startTanStackStartProdServer } = await import('./adapters/tanstackStartProdServer.js')
      serverResult = await startTanStackStartProdServer({
        port: availablePort,
        testSuiteArg,
      })
    } else {
      const { startTanStackStartDevServer } = await import('./adapters/tanstackStartDevServer.js')
      serverResult = await startTanStackStartDevServer({
        port: availablePort,
        testSuiteArg,
      })
    }
    break
  }
  default: {
    console.log(
      chalk.red(`ERROR: Unknown framework adapter "${framework}". Supported: next, tanstack-start`),
    )
    process.exit(1)
  }
}

// Open the admin if the -o flag is passed
if (args.o) {
  await open(`http://localhost:${serverResult.port}${serverResult.adminRoute}`)
}

process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE === 'false' ? 'false' : 'true'

void fetch(`http://localhost:${serverResult.port}${serverResult.adminRoute}`).catch(() => {})
void fetch(`http://localhost:${serverResult.port}/api/access`).catch(() => {})

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
  process.exit(0)
})
