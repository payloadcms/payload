#!/usr/bin/env node

import { Command } from 'commander'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// An unresolved import can let Node exit before the CLI finishes.
const failOnIncompleteRun = () => {
  process.exitCode = 1
}
process.once('beforeExit', failOnIncompleteRun)

const bootstrap = new Command()
  .helpOption(false)
  .allowUnknownOption()
  .argument('[args...]')
  .option('--disable-transpile')
  .option('--use-swc')
  .parse(process.argv)
const { disableTranspile, useSwc } = bootstrap.opts()

process.argv = [...process.argv.slice(0, 2), ...bootstrap.args]

if (disableTranspile) {
  const start = async () => {
    const { bin } = await import('./dist/cli/index.js')
    await bin()
    process.off('beforeExit', failOnIncompleteRun)
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

      const { bin } = await tsImport('./dist/cli/index.js', url)
      await bin()
      process.off('beforeExit', failOnIncompleteRun)
    }

    void start()
  } else if (useSwc) {
    const { register } = await import('node:module')

    try {
      register('@swc-node/register/esm', url)
    } catch (_) {
      console.error(
        '@swc-node/register is not installed. Please install @swc-node/register in your project, if you want to use swc in payload run.',
      )
    }

    const start = async () => {
      const { bin } = await import('./dist/cli/index.js')
      await bin()
      process.off('beforeExit', failOnIncompleteRun)
    }

    void start()
  }
}
