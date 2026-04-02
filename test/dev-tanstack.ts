import chalk from 'chalk'
import minimist from 'minimist'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'payload/node'

import { runInit } from './runInit.js'
import { replacePayloadConfigPath } from './testHooks.js'

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const {
  _: [_testSuiteArg = '_community'],
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

console.log(`Selected test suite: ${testSuiteArg} [TanStack Start / Vinxi]`)

const tanstackAppDir = path.resolve(dirname, '..', 'tanstack-app')
const configPath = `../test/${testSuiteArg}/${testSuiteConfigOverride ?? 'config.ts'}`

// Point ROOT_DIR to the TanStack app so initDevAndTest writes to the right importMap location
process.env.ROOT_DIR = tanstackAppDir
process.env.PAYLOAD_CONFIG_PATH = path.resolve(
  dirname,
  testSuiteArg,
  testSuiteConfigOverride ?? 'config.ts',
)

await replacePayloadConfigPath(tanstackAppDir, configPath)

await runInit(testSuiteArg, true, false, testSuiteConfigOverride)

const port = process.env.PORT ? Number(process.env.PORT) : 3000

process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE === 'false' ? 'false' : 'true'

console.log(chalk.green(`✓ TanStack Start dev server starting on port ${port}`))
console.log(chalk.cyan(`  Admin: http://localhost:${port}/admin`))

const vinxiProcess = spawn('pnpm', ['vite', 'dev', '--port', String(port)], {
  cwd: tanstackAppDir,
  env: {
    ...process.env,
    PORT: String(port),
  },
  stdio: 'inherit',
})

process.on('SIGINT', () => {
  vinxiProcess.kill('SIGINT')
  process.exit(0)
})
process.on('SIGTERM', () => {
  vinxiProcess.kill('SIGTERM')
  process.exit(0)
})

await new Promise<void>((resolve, reject) => {
  vinxiProcess.on('error', (err) => reject(err))
  vinxiProcess.on('close', (code) => {
    if (!code) {
      resolve()
    } else {
      reject(new Error(`Vinxi exited with code ${code}`))
    }
  })
})
