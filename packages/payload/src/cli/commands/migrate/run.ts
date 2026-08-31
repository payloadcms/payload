import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateCommand = defineCLICommand({
  description: 'Run pending migrations.',
  handler: async ({ args, getPayload, isJSON }) => {
    const { adapter, payload } = await initializeMigration({ getPayload })

    const result = await adapter.migrate({
      forceAcceptWarning: args.forceAcceptWarning,
      shouldPrompt: !isJSON,
    })

    if (!isJSON) {
      payload.logger.info(result?.cancelled ? 'Cancelled.' : 'Done.')
    }

    return result ? { result } : undefined
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    forceAcceptWarning: z.optional(z.boolean()).check(z.describe('Skip the migration warning.')),
  }),
})
