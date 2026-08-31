import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateCreateCommand = defineCLICommand({
  cli: {
    migrationName: 'argument',
  },
  description: 'Create a migration.',
  handler: async ({ args, getPayload, isJSON }) => {
    const { adapter, payload } = await initializeMigration({
      disableDBConnect: true,
      getPayload,
    })

    try {
      const result = await adapter.createMigration({
        file: args.file,
        forceAcceptWarning: args.forceAcceptWarning,
        migrationName: args.migrationName,
        payload,
        shouldPrompt: !isJSON,
        skipEmpty: args.skipEmpty,
      })

      if (!isJSON) {
        payload.logger.info(result && !result.created ? 'Cancelled.' : 'Done.')
      }

      return result ? { result } : undefined
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      throw new Error(`Error creating migration: ${message}`)
    }
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    file: z.optional(z.string()).check(z.describe('Create from a predefined migration module.')),
    forceAcceptWarning: z.optional(z.boolean()).check(z.describe('Skip the migration warning.')),
    migrationName: z.optional(z.string()).check(z.describe('Name of the migration.')),
    skipEmpty: z.optional(z.boolean()).check(z.describe('Do not create an empty migration.')),
  }),
})
