import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateResetCommand = defineCLICommand({
  name: 'migrate:reset',
  description: 'Roll back all migrations.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    await adapter.migrateReset()
    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
