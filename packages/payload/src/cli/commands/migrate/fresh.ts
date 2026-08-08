import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateFreshCommand = defineCLICommand({
  name: 'migrate:fresh',
  description: 'Run all migrations from a clean database.',
  handler: async ({ args, getPayload }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    await adapter.migrateFresh({ forceAcceptWarning: args.forceAcceptWarning })
    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    forceAcceptWarning: z
      .optional(z.boolean())
      .check(z.describe('Skip the destructive migration warning.')),
  }),
})
