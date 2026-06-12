#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const useSwc = process.argv.includes('--use-swc')
const disableTranspile = process.argv.includes('--disable-transpile')

if (disableTranspile) {
  // Remove --disable-transpile from arguments
  process.argv = process.argv.filter((arg) => arg !== '--disable-transpile')

  const start = async () => {
    const { bin } = await import('./dist/bin/index.js')
    await bin()
  }

  void start()
} else {
  const require = createRequire(import.meta.url)
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  if (!useSwc) {
    const binPath = path.resolve(dirname, 'dist/bin/index.js')
    const binURL = pathToFileURL(binPath).href
    const tsxLoader = require.resolve('tsx')
    const script = `
      process.argv = [process.argv[0], ${JSON.stringify(binPath)}, ...process.argv.slice(1)]
      import(${JSON.stringify(binURL)})
        .then(({ bin }) => bin())
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
    `
    const result = spawnSync(process.execPath, ['--import', tsxLoader, '--eval', script, ...process.argv.slice(2)], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    })

    if (result.error) {
      throw result.error
    }

    process.exit(result.status ?? 1)
  } else if (useSwc) {
    const { register } = await import('node:module')
    // Remove --use-swc from arguments
    process.argv = process.argv.filter((arg) => arg !== '--use-swc')

    try {
      register('@swc-node/register/esm', url)
    } catch (_) {
      console.error(
        '@swc-node/register is not installed. Please install @swc-node/register in your project, if you want to use swc in payload run.',
      )
    }

    const start = async () => {
      const { bin } = await import('./dist/bin/index.js')
      await bin()
    }

    void start()
  }
}
