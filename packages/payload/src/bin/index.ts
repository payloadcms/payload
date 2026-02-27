/* eslint-disable no-console */
import { Cron } from 'croner'
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import path from 'path'

import { findConfig } from '../config/find.js'
import { getPayload, type Payload } from '../index.js'
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
  'jobs:handle-schedules',
  'run',
  ...migrateCommands,
] as const

export const bin = async () => {
  loadEnv()
  process.env.DISABLE_PAYLOAD_HMR = 'true'

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  if (args.cron) {
    new Cron(
      args.cron,
      async () => {
        // If the bin script initializes payload (getPayload), this will only happen once, as getPayload
        // caches the payload instance on the module scope => no need to manually cache and manage getPayload initialization
        // outside the Cron here.
        await runBinScript({ args, script })
      },
      {
        // Do not run consecutive crons if previous crons still ongoing
        protect: true,
      },
    )

    process.stdin.resume() // Keep the process alive

    return
  } else {
    const { exitCode, payload } = await runBinScript({ args, script })
    if (payload) {
      await payload.destroy() // close database connections after running jobs so process can exit cleanly
    }
    process.exit(exitCode ?? 0)
  }
}

async function runBinScript({
  args,
  script,
}: {
  args: minimist.ParsedArgs
  script: string
}): Promise<{
  /**
   * Scripts can return a payload instance if it exists. The bin script runner can then safely
   * shut off the instance, depending on if it's running in a cron job or not.
   */
  exitCode?: number
  payload?: Payload
}> {
  if (script === 'info') {
    await info()
    return {}
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
    process.argv = [process.argv[0]!, process.argv[1]!, ...args._.slice(2)]

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
    return {}
  }

  const configPath = findConfig()
  const configPromise = await import(pathToFileURL(configPath).toString())
  let config = await configPromise
  if (config.default) {
    config = await config.default
  }

  const userBinScript = Array.isArray(config.bin)
    ? config.bin.find(({ key }: { key: string }) => key === script)
    : false

  if (userBinScript) {
    let exitCode: number | undefined
    let payload: Payload | undefined
    try {
      const module = await import(pathToFileURL(userBinScript.scriptPath).toString())

      if (!module.script || typeof module.script !== 'function') {
        console.error(
          `Could not find "script" function export for script ${userBinScript.key} in ${userBinScript.scriptPath}`,
        )
        exitCode = 1
      } else {
        ({ exitCode, payload } = await module.script(config).catch((err: unknown) => {
          console.log(`Script ${userBinScript.key} failed, details:`)
          console.error(err)
          return { exitCode: 1 }
        }) ?? {})
      }
    } catch (err) {
      console.log(`Could not find associated bin script for the ${userBinScript.key} command`)
      console.error(err)
      exitCode = 1
    }

    return { exitCode, payload }
  }

  if (script.startsWith('migrate')) {
    await migrate({ config, parsedArgs: args })
    return {}
  }

  if (script === 'generate:types') {
    await generateTypes(config)
    return {}
  }

  if (script === 'generate:importmap') {
    await generateImportMap(config)
    return {}
  }

  if (script === 'jobs:run') {
    const payload = await getPayload({ config }) // Do not setup crons here - this bin script can set up its own crons
    const limit = args.limit ? parseInt(args.limit, 10) : undefined
    const queue = args.queue ? args.queue : undefined
    const allQueues = !!args['all-queues']
    const handleSchedules = !!args['handle-schedules']

    if (handleSchedules) {
      await payload.jobs.handleSchedules({
        allQueues,
        queue,
      })
    }

    await payload.jobs.run({
      allQueues,
      limit,
      queue,
    })

    return { payload }
  }

  if (script === 'jobs:handle-schedules') {
    const payload = await getPayload({ config }) // Do not setup crons here - this bin script can set up its own crons
    const queue = args.queue ? args.queue : undefined
    const allQueues = !!args['all-queues']

    await payload.jobs.handleSchedules({
      allQueues,
      queue,
    })

    return { payload }
  }

  if (script === 'generate:db-schema') {
    // Barebones instance to access database adapter, without connecting to the DB
    const payload = await getPayload({ config, disableDBConnect: true, disableOnInit: true }) // Do not setup crons here

    if (typeof payload.db.generateSchema !== 'function') {
      payload.logger.error({
        msg: `${payload.db.packageName} does not support database schema generation`,
      })

      await payload.destroy()
      process.exit(1)
    }

    await payload.db.generateSchema({
      log: args.log === 'false' ? false : true,
      prettify: args.prettify === 'false' ? false : true,
    })

    return { payload }
  }

  console.error(script ? `Unknown command: "${script}"` : 'Please provide a command to run')
  console.log(`\nAvailable commands:\n${availableScripts.map((c) => `  - ${c}`).join('\n')}`)

  process.exit(1)
}
