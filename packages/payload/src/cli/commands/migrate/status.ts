import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateStatusCommand = defineCLICommand({
  name: 'migrate:status',
  description: 'Show migration status.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    await adapter.migrateStatus()
    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
