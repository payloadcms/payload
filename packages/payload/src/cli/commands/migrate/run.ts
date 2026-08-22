import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateCommand = defineCLICommand({
  description: 'Run pending migrations.',
  handler: async ({ getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    await adapter.migrate()
    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
