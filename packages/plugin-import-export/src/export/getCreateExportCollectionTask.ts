import type { Config, PayloadRequest, TaskConfig, TypedUser } from 'payload'

import type { ExportJobInputData, ImportExportPluginConfig } from '../types.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

/**
 * Export input type for job queue serialization.
 * When exports are queued as jobs, the user must be serialized as an ID string or number
 * along with the collection name so it can be rehydrated when the job runs.
 */

export const getCreateCollectionExportTask = (
  config: Config,
  pluginConfig?: ImportExportPluginConfig,
): TaskConfig<{
  input: ExportJobInputData
  output: object
}> => {
  const inputSchema = getFields(config, pluginConfig).concat(
    {
      name: 'user',
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
    handler: async ({ input, req }: { input: ExportJobInputData; req: PayloadRequest }) => {
      let user: TypedUser | undefined

      if (input.userCollection && input.user) {
        user = (await req.payload.findByID({
          id: input.user,
          collection: input.userCollection,
        })) as TypedUser

        req.user = user
      }

      if (!user) {
        throw new Error('User not found')
      }

      // Strip out user and userCollection from input - they're only needed for rehydration
      const { doc, user: _userId, userCollection: _userCollection } = input

      await createExport({ doc, req, user })

      return {
        output: {},
      }
    },
    inputSchema,
  }
}
