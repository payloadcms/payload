import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { slateEditor } from '@payloadcms/richtext-slate'

import type { Post } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
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
    {
      slug: 'shops',
      access: { read: () => true },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'items',
          type: 'relationship',
          hasMany: true,
          relationTo: 'items',
        },
      ],
    },
    {
      slug: 'items',
      access: { read: () => true },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'itemTags',
          type: 'relationship',
          hasMany: true,
          relationTo: 'itemTags',
        },
      ],
    },
    {
      slug: 'itemTags',
      access: { read: () => true },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
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

    const tag = await payload.create({
      collection: 'itemTags',
      data: { name: 'tag1' },
    })
    const item = await payload.create({
      collection: 'items',
      data: { name: 'item1', itemTags: [tag.id] },
    })
    const shop = await payload.create({
      collection: 'shops',
      data: { name: 'shop1', items: [item.id] },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export const postDoc: Pick<Post, 'title'> = {
  title: 'test post',
}
