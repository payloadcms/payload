import type { Config, TaskConfig } from 'payload'

import type { Export } from './createExport.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

/**
 * Export input type for job queue serialization.
 * When exports are queued as jobs, the user must be serialized as an ID string or number
 * along with the collection name so it can be rehydrated when the job runs.
 */
export type ExportJobInput = {
  user: number | string
  userCollection: string
} & Export

export const getCreateCollectionExportTask = (
  config: Config,
): TaskConfig<{
  input: ExportJobInput
  output: object
}> => {
  // Job queue task needs all collection slugs since it can handle exports for any collection
  const allCollectionSlugs = config.collections?.map((c) => c.slug) || []
  const inputSchema = getFields({ collectionSlugs: allCollectionSlugs, config }).concat(
    {
      name: 'userID',
      type: 'text',
    },
    {
      name: 'userCollection',
      type: 'text',
    },
    {
      name: 'exportCollection',
      type: 'text',
    },
    {
      name: 'maxLimit',
      type: 'number',
    },
  )

  return {
    slug: 'createCollectionExport',
    handler: async ({ input, req }) => {
      if (!input) {
        req.payload.logger.error('No input provided to createCollectionExport task')

        return { output: {} }
      }

      await createExport({
        ...input,
        req,
      })

      return {
        output: {},
      }
    },
    inputSchema,
  }
}
