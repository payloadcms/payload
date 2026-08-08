import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateCreateCommand = defineCLICommand({
  name: 'migrate:create',
  cli: {
    migrationName: 'argument',
  },
  description: 'Create a migration.',
  handler: async ({ args, getPayload }) => {
    const { adapter, payload } = await initializeMigration({
      disableDBConnect: true,
      getPayload,
    })

    try {
      await adapter.createMigration({
        file: args.file,
        forceAcceptWarning: args.forceAcceptWarning,
        migrationName: args.migrationName,
        payload,
        skipEmpty: args.skipEmpty,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      throw new Error(`Error creating migration: ${message}`)
    }

    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    file: z.optional(z.string()).check(z.describe('Create from a predefined migration module.')),
    forceAcceptWarning: z.optional(z.boolean()).check(z.describe('Skip the migration warning.')),
    migrationName: z.optional(z.string()).check(z.describe('Name of the migration.')),
    skipEmpty: z.optional(z.boolean()).check(z.describe('Do not create an empty migration.')),
  }),
})
