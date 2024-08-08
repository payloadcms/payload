import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
            },
          ],
        },
      ],
    },
    {
      slug: 'categories',
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'posts',
          type: 'join',
          collection: 'posts',
          on: 'category',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'posts',
              type: 'join',
              collection: 'posts',
              on: 'group.category',
            },
          ],
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        name: 'example',
        group: {},
      },
    })

    const post1 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })
    const post2 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })
    const post3 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
