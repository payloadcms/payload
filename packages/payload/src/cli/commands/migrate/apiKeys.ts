import * as z from 'zod/mini'

import { migrateAPIKeys } from '../../../auth/apiKeys/migration.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { initializeMigration } from './initialize.js'

export const createMigrateAPIKeysCommand = defineCLICommand({
  description: 'Migrate legacy API keys into the payload-api-keys collection.',
  handler: async ({ args, getPayload }) => {
    const { payload } = await initializeMigration({
      disableAPIKeyStartupGuard: true,
      getPayload,
    })

    const dryRun = args.dryRun ?? false

    const result = await migrateAPIKeys({
      batchSize: args.batchSize,
      collections: args.collections,
      dryRun,
      payload,
    })

    payload.logger.info(
      `${dryRun ? '[dry run] ' : ''}migrated: ${result.migrated}, scrubbed: ${result.scrubbed}, skipped: ${result.skipped}`,
    )
    payload.logger.info('Done.')
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    batchSize: z
      .optional(z.int().check(z.positive()))
      .check(z.describe('Rows processed per batch, per collection.')),
    collections: z
      .optional(z.array(z.string()))
      .check(z.describe('Limit the migration to these collection slugs.')),
    dryRun: z
      .optional(z.boolean())
      .check(z.describe('Validate every row and report counts without writing.')),
  }),
})
