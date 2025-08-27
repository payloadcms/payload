import type { Config, TaskConfig, TypedUser } from 'payload'

import type { ImportExportPluginConfig } from '../types.js'
import type { CreateExportArgs, Export } from './createExport.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

export const getCreateCollectionExportTask = (
  config: Config,
  pluginConfig?: ImportExportPluginConfig,
): TaskConfig<{
  input: Export
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
    handler: async ({ input, req }: CreateExportArgs) => {
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

      await createExport({ input, req, user })

      return {
        output: {},
      }
    },
    inputSchema,
  }
}
