import type { Config, TaskHandler, User } from 'payload'

import type { CreateExportArgs } from './createExport.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'

export const getCreateCollectionExportTask = (config: Config): TaskHandler<any, string> => {
  const inputSchema = getFields(config).concat(
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
    // @ts-expect-error plugin tasks cannot have predefined type slug
    slug: 'createCollectionExport',
    handler: async ({ input, req }: CreateExportArgs) => {
      let user: undefined | User

      if (input.userCollection && input.user) {
        user = (await req.payload.findByID({
          id: input.user,
          collection: input.userCollection,
        })) as User
      }

      if (!user) {
        throw new Error('User not found')
      }

      await createExport({ input, req, user })

      return {
        success: true,
      }
    },
    inputSchema,
    outputSchema: [
      {
        name: 'success',
        type: 'checkbox',
      },
    ],
  }
}
