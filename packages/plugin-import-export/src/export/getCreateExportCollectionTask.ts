import type { Config, Field, TaskConfig } from 'payload'

import type { Export } from './createExport.js'

import { createExport } from './createExport.js'

/**
 * Export input type for job queue serialization.
 * When exports are queued as jobs, the user must be serialized as an ID string or number
 * along with the collection name so it can be rehydrated when the job runs.
 */
export type ExportJobInput = {
  user: number | string
  userCollection: string
} & Export

/**
 * Creates a minimal inputSchema for the job queue task.
 */
const getJobInputSchema = (config: Config): Field[] => {
  const allCollectionSlugs = config.collections?.map((c) => c.slug) || []

  const collectionOptions = allCollectionSlugs.map((slug) => {
    const collectionConfig = config.collections?.find((c) => c.slug === slug)
    return {
      label: collectionConfig?.labels?.singular || slug,
      value: slug,
    }
  })

  return [
    {
      name: 'id',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'batchSize',
      type: 'number',
    },
    {
      name: 'collectionSlug',
      type: 'select',
      options: collectionOptions,
      required: true,
    },
    {
      name: 'drafts',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      name: 'exportCollection',
      type: 'text',
      required: true,
    },
    {
      name: 'fields',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'CSV', value: 'csv' },
        { label: 'JSON', value: 'json' },
      ],
      required: true,
    },
    {
      name: 'limit',
      type: 'number',
    },
    {
      name: 'locale',
      type: 'text',
    },
    {
      name: 'maxLimit',
      type: 'number',
    },
    {
      name: 'page',
      type: 'number',
    },
    {
      name: 'sort',
      type: 'text',
    },
    {
      name: 'userCollection',
      type: 'text',
    },
    {
      name: 'userID',
      type: 'text',
    },
    {
      name: 'where',
      type: 'json',
    },
  ]
}

export const getCreateCollectionExportTask = (
  config: Config,
): TaskConfig<{
  input: ExportJobInput
  output: object
}> => {
  const inputSchema = getJobInputSchema(config)

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
