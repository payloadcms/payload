import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateStatusCommand = defineCLICommand({
  description: 'Show migration status.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    const result = await adapter.migrateStatus()

    payload.logger.info('Done.')

    return result ? { result } : undefined
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
