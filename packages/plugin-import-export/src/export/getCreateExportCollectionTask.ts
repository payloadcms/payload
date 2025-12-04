import type { Config, TaskConfig } from 'payload'

import type { Export } from './createExport.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

export const getCreateCollectionExportTask = (
  config: Config,
): TaskConfig<{
  input: Export
  output: object
}> => {
  const inputSchema = getFields(config).concat(
    {
      name: 'userID',
      type: 'text',
    },
    {
      name: 'userCollection',
      type: 'text',
    },
    {
      name: 'exportsCollection',
      type: 'text',
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
