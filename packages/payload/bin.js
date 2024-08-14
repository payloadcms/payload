#!/usr/bin/env node --no-deprecation

import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const useTsx = process.argv.includes('--use-tsx')

// Allow disabling SWC/TSX for debugging
if (process.env.DISABLE_SWC !== 'true' && !useTsx) {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  register('@swc-node/register/esm', url)

  const start = async () => {
    const { bin } = await import('./dist/bin/index.js')
    await bin()
  }

  void start()
} else if (useTsx) {
  // Remove --use-tsx from arguments
  process.argv = process.argv.filter((arg) => arg !== '--use-tsx')

  const start = async () => {
    // Use tsx
    let tsImport
    try {
      tsImport = (await import('tsx/esm/api')).tsImport
    } catch (_) {
      console.error(
        'tsx is not installed. Please install tsx in your project, if you want to use tsx in payload run.',
      )
      return
    }

    const { bin } = await tsImport('./dist/bin/index.js', import.meta.url)
    await bin()
  }

  void start()
}
