import type { ParsedArgs } from 'minimist'

import type { SanitizedConfig } from '../config/types.js'

import payload from '../index.js'
import { prettySyncLoggerDestination } from '../utilities/logger.js'

/**
 * The default logger's options did not allow for forcing sync logging
 * Using these options, to force both pretty print and sync logging
 */
const prettySyncLogger = {
  loggerDestination: prettySyncLoggerDestination,
  loggerOptions: {},
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
  const { _: args, file, forceAcceptWarning: forceAcceptFromProps, help } = parsedArgs

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
  const check = formattedArgs.includes('check')

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
    ...prettySyncLogger,
  })

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
      await adapter.migrate()
      break
    case 'migrate:create':
      try {
        await adapter.createMigration({
          check,
          file,
          forceAcceptWarning,
          migrationName: args[1],
          payload,
          skipEmpty,
        })
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error'
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
