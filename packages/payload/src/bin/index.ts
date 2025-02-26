// @ts-strict-ignore
/* eslint-disable no-console */
import { Cron } from 'croner'
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import path from 'path'

import type { BinScript } from '../config/types.js'

import { findConfig } from '../config/find.js'
import payload, { getPayload } from '../index.js'
import { generateImportMap } from './generateImportMap/index.js'
import { generateTypes } from './generateTypes.js'
import { info } from './info.js'
import { loadEnv } from './loadEnv.js'
import { migrate, availableCommands as migrateCommands } from './migrate.js'

// Note: this does not account for any user bin scripts
const availableScripts = [
  'generate:db-schema',
  'generate:importmap',
  'generate:types',
  'info',
  'jobs:run',
  'run',
  ...migrateCommands,
] as const

export const bin = async () => {
  loadEnv()

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  if (script === 'info') {
    await info()
    return
  }

  if (script === 'run') {
    const scriptPath = args._[1]
    if (!scriptPath) {
      console.error('Please provide a script path to run.')
      process.exit(1)
    }

    const absoluteScriptPath = path.resolve(process.cwd(), scriptPath)

    // Modify process.argv to remove 'run' and the script path
    const originalArgv = process.argv
    process.argv = [process.argv[0], process.argv[1], ...args._.slice(2)]

    try {
      await import(pathToFileURL(absoluteScriptPath).toString())
    } catch (error) {
      console.error(`Error running script: ${absoluteScriptPath}`)
      console.error(error)
      process.exit(1)
    } finally {
      // Restore original process.argv
      process.argv = originalArgv
    }
    return
  }

  const configPath = findConfig()
  const configPromise = await import(pathToFileURL(configPath).toString())
  let config = await configPromise
  if (config.default) {
    config = await config.default
  }

  const userBinScript = Array.isArray(config.bin)
    ? config.bin.find(({ key }) => key === script)
    : false

  if (userBinScript) {
    try {
      const module = await import(pathToFileURL(userBinScript.scriptPath).toString())

      if (!module.script || typeof module.script !== 'function') {
        console.error(
          `Could not find "script" function export for script ${userBinScript.key} in ${userBinScript.scriptPath}`,
        )
      } else {
        await module.script(config).catch((err: unknown) => {
          console.log(`Script ${userBinScript.key} failed, details:`)
          console.error(err)
        })
      }
    } catch (err) {
      console.log(`Could not find associated bin script for the ${userBinScript.key} command`)
      console.error(err)
    }

    return
  }

  if (script.startsWith('migrate')) {
    return migrate({ config, parsedArgs: args }).then(() => process.exit(0))
  }

  if (script === 'generate:types') {
    return generateTypes(config)
  }

  if (script === 'generate:importmap') {
    return generateImportMap(config)
  }

  if (script === 'jobs:run') {
    const payload = await getPayload({ config })
    const limit = args.limit ? parseInt(args.limit, 10) : undefined
    const queue = args.queue ? args.queue : undefined

    if (args.cron) {
      new Cron(args.cron, async () => {
        await payload.jobs.run({
          limit,
          queue,
        })
      })

      process.stdin.resume() // Keep the process alive

      return
    } else {
      await payload.jobs.run({
        limit,
        queue,
      })

      await payload.db.destroy() // close database connections after running jobs so process can exit cleanly

      return
    }
  }

  if (script === 'generate:db-schema') {
    // Barebones instance to access database adapter, without connecting to the DB
    await payload.init({
      config,
      disableDBConnect: true,
      disableOnInit: true,
    })

    if (typeof payload.db.generateSchema !== 'function') {
      payload.logger.error({
        msg: `${payload.db.packageName} does not support database schema generation`,
      })

      process.exit(1)
    }

    await payload.db.generateSchema({
      log: args.log === 'false' ? false : true,
      prettify: args.prettify === 'false' ? false : true,
    })

    process.exit(0)
  }

  console.error(script ? `Unknown command: "${script}"` : 'Please provide a command to run')
  console.log(`\nAvailable commands:\n${availableScripts.map((c) => `  - ${c}`).join('\n')}`)

  process.exit(1)
}
