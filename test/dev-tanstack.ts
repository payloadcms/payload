import chalk from 'chalk'
import minimist from 'minimist'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'payload/node'

import { runInit } from './runInit.js'

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const {
  _: [_testSuiteArg = '_community'],
} = minimist(process.argv.slice(2))

const testSuiteArg = _testSuiteArg

console.log(`Selected test suite: ${testSuiteArg} [TanStack Start / Vinxi]`)

const tanstackAppDir = path.resolve(dirname, '..', 'tanstack-app')

// Point ROOT_DIR to the TanStack app so initDevAndTest writes to the right importMap location
process.env.ROOT_DIR = tanstackAppDir

await runInit(testSuiteArg, true, false)

const port = process.env.PORT ? Number(process.env.PORT) : 3000

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
