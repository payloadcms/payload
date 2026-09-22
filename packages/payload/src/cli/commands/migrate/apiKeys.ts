import * as z from 'zod/mini'

import { migrateAPIKeysToHash } from '../../../auth/apiKeys/migrateToHash.js'
import { strictObject } from '../../../utilities/zod.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { initializeMigration } from './initialize.js'

export const createMigrateAPIKeysCommand = defineCLICommand({
  description:
    'Convert API keys written before they were stored as one-way hashes. Run once after upgrading.',
  handler: async ({ args, getPayload, isJSON }) => {
    const { payload } = await initializeMigration({ getPayload })

    const result = await migrateAPIKeysToHash({
      collections: args.collections,
      dryRun: args.dryRun,
      payload,
      secrets: args.secret ? [args.secret] : undefined,
    })

    if (!isJSON) {
      payload.logger.info(
        `${args.dryRun ? 'Dry run: ' : ''}migrated ${result.migrated}, skipped ${result.skipped}, failed ${result.failed}.`,
      )

      if (result.failed > 0) {
        payload.logger.warn(
          'Some keys could not be recovered. Those documents are unchanged - pass --secret with the PAYLOAD_SECRET they were encrypted under, or regenerate those keys.',
        )
      }
    }

    return { result }
  },
  helpGroup: 'Migration commands',
  input: strictObject({
    collections: z
      .optional(z.array(z.string()))
      .check(
        z.describe('Limit to these collection slugs. Defaults to every useAPIKey collection.'),
      ),
    dryRun: z
      .optional(z.boolean())
      .check(z.describe('Report what would change without writing anything.')),
    secret: z
      .optional(z.string())
      .check(
        z.describe(
          'An additional PAYLOAD_SECRET to try, for keys encrypted under a secret that is no longer in the keyring.',
        ),
      ),
  }),
})
