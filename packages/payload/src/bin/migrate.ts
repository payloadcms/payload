import type { ParsedArgs } from 'minimist'

import minimist from 'minimist'

import payload from '..'
import { prettySyncLoggerDestination } from '../utilities/logger'

/**
 * The default logger's options did not allow for forcing sync logging
 * Using these options, to force both pretty print and sync logging
 */
const prettySyncLogger = {
  loggerDestination: prettySyncLoggerDestination,
  loggerOptions: {},
}

const availableCommands = [
  'migrate',
  'migrate:create',
  'migrate:down',
  'migrate:refresh',
  'migrate:reset',
  'migrate:status',
  'migration:fresh',
]

const availableCommandsMsg = `Available commands: ${availableCommands.join(', ')}`

export const migrate = async (parsedArgs: ParsedArgs): Promise<void> => {
  const { _: args, file, forceAcceptWarning, help } = parsedArgs
  if (help) {
    // eslint-disable-next-line no-console
    console.log(`\n\n${availableCommandsMsg}\n`) // Avoid having to init payload to get the logger
    process.exit(0)
  }

  process.env.PAYLOAD_MIGRATING = 'true'

  // Barebones instance to access database adapter
  await payload.init({
    disableOnInit: true,
    local: true,
    secret: process.env.PAYLOAD_SECRET || '--unused--',
    ...prettySyncLogger,
  })

  const adapter = payload.db

  if (!adapter) {
    throw new Error('No database adapter found')
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
    case 'migrate:status':
      await adapter.migrateStatus()
      break
    case 'migrate:down':
      await adapter.migrateDown()
      break
    case 'migrate:refresh':
      await adapter.migrateRefresh()
      break
    case 'migrate:reset':
      await adapter.migrateReset()
      break
    case 'migrate:fresh':
      await adapter.migrateFresh({ forceAcceptWarning })
      break
    case 'migrate:create':
      try {
        await adapter.createMigration({
          file,
          forceAcceptWarning,
          migrationName: args[1],
          payload,
        })
      } catch (err) {
        throw new Error(`Error creating migration: ${err.message}`)
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

// When launched directly call migrate
if (module.id === require.main.id) {
  const args = minimist(process.argv.slice(2))
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  migrate(args).then(() => {
    process.exit(0)
  })
}
