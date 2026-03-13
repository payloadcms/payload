import type { ParsedArgs } from 'minimist'

import type { SanitizedConfig } from '../config/types.js'

import payload from '../index.js'
import { stderrSyncLoggerDestination, writeJsonResult } from '../utilities/jsonReporter.js'

/**
 * Read all data from stdin. Returns empty string if stdin is a TTY (no pipe).
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return ''
  }

  const chunks: Buffer[] = []

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').trim()))
    process.stdin.on('error', () => resolve(''))
  })
}

export const availableCommands = [
  'migrate',
  'migrate:create',
  'migrate:down',
  'migrate:refresh',
  'migrate:reset',
  'migrate:status',
  'migrate:fresh',
]

const availableCommandsMsg = `Available commands: ${availableCommands.join(', ')}`

type Args = {
  config: SanitizedConfig
  /**
   * Override the migration directory. Useful for testing when the CWD differs
   * from where the test config expects migrations to be stored.
   */
  migrationDir?: string
  parsedArgs: ParsedArgs
}

export const migrate = async ({ config, migrationDir, parsedArgs }: Args): Promise<void> => {
  const {
    _: args,
    dryRun: dryRunFromProps,
    file,
    forceAcceptWarning: forceAcceptFromProps,
    fromStdin: fromStdinFromProps,
    help,
    json: jsonFromProps,
  } = parsedArgs

  const formattedArgs = Object.keys(parsedArgs)
    .map((key) => {
      const formattedKey = key.replace(/^[-_]+/, '')
      if (!formattedKey) {
        return null
      }

      return formattedKey
        .split('-')
        .map((word, index) =>
          index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('')
    })
    .filter(Boolean)

  const forceAcceptWarning = forceAcceptFromProps || formattedArgs.includes('forceAcceptWarning')
  const skipEmpty = formattedArgs.includes('skipEmpty')
  const json = jsonFromProps || formattedArgs.includes('json')
  const dryRun = dryRunFromProps || formattedArgs.includes('dryRun')
  const fromStdinFlag = fromStdinFromProps || formattedArgs.includes('fromStdin')

  if (help) {
    // eslint-disable-next-line no-console
    console.log(`\n\n${availableCommandsMsg}\n`) // Avoid having to init payload to get the logger
    process.exit(0)
  }

  process.env.PAYLOAD_MIGRATING = 'true'

  // Barebones instance to access database adapter
  await payload.init({
    config,
    disableDBConnect: args[0] === 'migrate:create',
    disableOnInit: true,
  })

  // When --json is active, redirect logger to stderr so JSON output on stdout is clean
  if (json) {
    const { pino } = await import('pino')
    payload.logger = pino(stderrSyncLoggerDestination)
  }

  const adapter = payload.db

  if (!adapter) {
    throw new Error('No database adapter found')
  }

  // Override migrationDir if provided (useful for testing)
  if (migrationDir) {
    adapter.migrationDir = migrationDir
  }

  if (!args.length) {
    payload.logger.error({
      msg: `No migration command provided. ${availableCommandsMsg}`,
    })
    process.exit(1)
  }

  switch (args[0]) {
    case 'migrate':
      try {
        const result = await adapter.migrate({
          dryRun,
          forceAcceptWarning,
        })

        if (json) {
          writeJsonResult(result)
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error'
        if (json) {
          writeJsonResult({ error, migrationsRan: [], pending: 0, status: 'error' })
        }
        payload.logger.error({ msg: error })
        process.exit(1)
      }
      break
    case 'migrate:create':
      try {
        let fromStdin: string | undefined

        if (fromStdinFlag) {
          // Support string value passed directly (e.g. from tests) or read from stdin
          fromStdin =
            typeof fromStdinFromProps === 'string' ? fromStdinFromProps : await readStdin()
          if (!fromStdin) {
            if (json) {
              writeJsonResult({
                error: 'No data received on stdin',
                hasChanges: false,
                status: 'error',
              })
            }
            payload.logger.error({
              msg: 'No data received on stdin. Pipe JSON to stdin when using --from-stdin.',
            })
            process.exit(1)
          }
        }

        const result = await adapter.createMigration({
          dryRun,
          file,
          forceAcceptWarning,
          fromStdin,
          migrationName: args[1],
          payload,
          skipEmpty,
        })

        if (json) {
          writeJsonResult(result)
        }

        if (result.status === 'error') {
          process.exit(1)
        }

        if (result.status === 'no-changes') {
          process.exit(2)
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error'
        if (json) {
          writeJsonResult({ error, hasChanges: false, status: 'error' })
        }
        throw new Error(`Error creating migration: ${error}`)
      }
      break
    case 'migrate:down':
      await adapter.migrateDown()
      break
    case 'migrate:fresh':
      await adapter.migrateFresh({ forceAcceptWarning })
      break
    case 'migrate:refresh':
      await adapter.migrateRefresh()
      break
    case 'migrate:reset':
      await adapter.migrateReset()
      break
    case 'migrate:status':
      await adapter.migrateStatus()
      break

    default:
      payload.logger.error({
        msg: `Unknown migration command: ${args[0]}. ${availableCommandsMsg}`,
      })
      process.exit(1)
  }

  payload.logger.info('Done.')
}
