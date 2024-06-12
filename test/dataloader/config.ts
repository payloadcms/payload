import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { slateEditor } from '@payloadcms/richtext-slate'

import type { Post } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'owner',
          type: 'relationship',
          hooks: {
            beforeChange: [({ req: { user } }) => user?.id],
          },
          relationTo: 'users',
        },
      ],
    },
    {
      slug: 'relation-a',
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-b',
        },
        {
          name: 'richText',
          type: 'richText',
          editor: slateEditor({}),
        },
      ],
      labels: {
        plural: 'Relation As',
        singular: 'Relation A',
      },
    },
    {
      slug: 'relation-b',
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'richText',
          type: 'richText',
          editor: slateEditor({}),
        },
      ],
      labels: {
        plural: 'Relation Bs',
        singular: 'Relation B',
      },
    },
  ],
  onInit: async (payload) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: 'posts',
      data: postDoc,
      user,
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export const postDoc: Pick<Post, 'title'> = {
  title: 'test post',
}
