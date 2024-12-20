import { Cron } from 'croner'
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import path from 'path'

import type { BinScript } from '../config/types.js'

import { findConfig } from '../config/find.js'
import { getPayload } from '../index.js'
import { generateImportMap } from './generateImportMap/index.js'
import { generateTypes } from './generateTypes.js'
import { info } from './info.js'
import { loadEnv } from './loadEnv.js'
import { migrate } from './migrate.js'

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
      const script: BinScript = await import(pathToFileURL(userBinScript.scriptPath).toString())
      await script(config)
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
      return await payload.jobs.run({
        limit,
        queue,
      })
    }
  }

  if (script === 'generate:db-schema') {
    const payload = await getPayload({ config })

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
  }

  console.error(`Unknown script: "${script}".`)
  process.exit(1)
}
