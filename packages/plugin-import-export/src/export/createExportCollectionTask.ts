import type { TaskHandler, User } from 'payload'

import type { CreateExportArgs } from './createExport.js'

import { fields } from '../getExportCollection.js'
import { createExport } from './createExport.js'

const inputSchema = fields.concat(
  {
    name: 'user',
    type: 'text',
  },
  {
    name: 'userCollection',
    type: 'text',
  },
)

export const createCollectionExportTask: TaskHandler<any, string> = {
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
