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

  await start()
} else {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  if (!useSwc) {
    const start = async () => {
      // tsx 4.22.4 uses Node's synchronous `module.registerHooks` API when it is available
      // (Node v23.5+). On those versions that code path leaks tsx's internal `?namespace=...`
      // query string onto resolved specifiers — including Node built-ins like `node:crypto` —
      // which Node then tries to open as a file, failing with ENOENT. Removing `registerHooks`
      // forces tsx to fall back to its older async `module.register()` worker path, which does
      // not have this bug. See https://github.com/payloadcms/payload/issues/16949
      const nodeModule = await import('node:module')
      if (typeof nodeModule.default.registerHooks === 'function') {
        nodeModule.default.registerHooks = undefined
      }

      // Use tsx
      let tsImport = (await import('tsx/esm/api')).tsImport

      const { bin } = await tsImport('./dist/bin/index.js', url)
      await bin()
    }

    await start()
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

    await start()
  }
}
