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
  'migrate:unlock',
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

      // Display lock status
      try {
        const lock = await payload.findGlobal({
          slug: 'payload-migrations-lock',
        })

        payload.logger.info({ msg: '\nMigration Lock Status:' })
        payload.logger.info({ msg: `  Locked: ${lock.locked ? 'Yes' : 'No'}` })

        if (lock.locked) {
          payload.logger.info({ msg: `  Locked by: ${lock.locked_by}` })
          payload.logger.info({ msg: `  Locked at: ${lock.locked_at}` })
          payload.logger.info({ msg: `  Expires at: ${lock.expires_at}` })
          const isStale = lock.expires_at && lock.expires_at < new Date()
          payload.logger.info({ msg: `  Status: ${isStale ? 'STALE' : 'Active'}` })
        }
      } catch (err) {
        // Lock global might not exist yet
        payload.logger.info({ msg: '\nMigration Lock Status: Not initialized' })
      }
      break
    case 'migrate:unlock':
      try {
        const lock = await payload.findGlobal({
          slug: 'payload-migrations-lock',
        })

        if (!lock.locked) {
          payload.logger.info({ msg: 'Migration lock is not currently held' })
          process.exit(0)
        }

        await payload.updateGlobal({
          slug: 'payload-migrations-lock',
          data: { locked: false },
        })

        payload.logger.info({
          msg: 'Migration lock forcibly released',
          was_locked_by: lock.locked_by,
        })
      } catch (err) {
        payload.logger.error({
          err,
          msg: 'Failed to unlock migrations. Lock global may not be initialized.',
        })
        process.exit(1)
      }
      break

    default:
      payload.logger.error({
        msg: `Unknown migration command: ${args[0]}. ${availableCommandsMsg}`,
      })
      process.exit(1)
  }

  payload.logger.info('Done.')
}
