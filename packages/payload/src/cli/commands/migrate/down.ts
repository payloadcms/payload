import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateDownCommand = defineCLICommand({
  description: 'Roll back the latest migration batch.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    const result = await adapter.migrateDown()

    payload.logger.info('Done.')

    return result ? { result } : undefined
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
