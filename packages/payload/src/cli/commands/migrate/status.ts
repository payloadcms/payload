import { strictObject } from '../../../utilities/zod.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { initializeMigration } from './initialize.js'

export const createMigrateStatusCommand = defineCLICommand({
  description: 'Show migration status.',
  handler: async ({ getPayload, isJSON }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    const result = await adapter.migrateStatus()

    if (!isJSON) {
      // Display lock status
      try {
        const lock = await payload.findGlobal({
          slug: 'payload-migrations-lock',
          overrideAccess: true,
        })

        payload.logger.info({ msg: '\nMigration Lock Status:' })
        payload.logger.info({ msg: `  Locked: ${lock.locked ? 'Yes' : 'No'}` })

        if (lock.locked) {
          payload.logger.info({ msg: `  Locked by: ${lock.locked_by}` })
          payload.logger.info({ msg: `  Locked at: ${lock.locked_at}` })
          payload.logger.info({ msg: `  Expires at: ${lock.expires_at}` })
          const isStale = lock.expires_at && new Date(lock.expires_at).getTime() <= Date.now()
          payload.logger.info({ msg: `  Status: ${isStale ? 'STALE' : 'Active'}` })
        }
      } catch {
        // Lock global might not exist yet
        payload.logger.info({ msg: '\nMigration Lock Status: Not initialized' })
      }
      payload.logger.info('Done.')
    }

    return result ? { result } : undefined
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
