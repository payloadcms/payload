import type { Config, PayloadRequest, TaskConfig, TypedUser } from 'payload'

import type { ImportExportPluginConfig } from '../types.js'
import type { ExportJobInput } from './createExport.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

export const getCreateCollectionExportTask = (
  config: Config,
  pluginConfig?: ImportExportPluginConfig,
): TaskConfig<{
  input: ExportJobInput
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
    handler: async ({ input, req }: { input: ExportJobInput; req: PayloadRequest }) => {
      let user: TypedUser | undefined

      if (input.userCollection && input.user) {
        user = (await req.payload.findByID({
          id: input.user,
          collection: input.userCollection,
        })) as TypedUser
      }

      if (!user) {
        throw new Error('User not found')
      }

      // Strip out user and userCollection from input - they're only needed for rehydration
      const { user: _userId, userCollection: _userCollection, ...exportInput } = input

      await createExport({ input: exportInput, req, user })

      return {
        output: {},
      }
    },
    inputSchema,
  }
}
