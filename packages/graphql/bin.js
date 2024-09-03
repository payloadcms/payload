#!/usr/bin/env node

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
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  if (!useSwc) {
    const start = async () => {
      // Use tsx
      let tsImport = (await import('tsx/esm/api')).tsImport

      const { bin } = await tsImport('./dist/bin/index.js', url)
      await bin()
    }

    void start()
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
