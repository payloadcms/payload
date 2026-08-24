import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateRefreshCommand = defineCLICommand({
  description: 'Roll back and re-run the latest migration batch.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    const result = await adapter.migrateRefresh()

    payload.logger.info('Done.')

    return result ? { result } : undefined
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
