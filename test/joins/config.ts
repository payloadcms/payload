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
        defaultColumns: ['title', 'category', 'updatedAt', 'createdAt'],
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
          label: 'Related Posts',
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
              label: 'Related Posts (Group)',
              type: 'join',
              collection: 'posts',
              on: 'group.category',
            },
          ],
        },
      ],
    },
    {
      slug: 'localized-posts',
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
          localized: true,
          relationTo: 'localized-categories',
        },
      ],
    },
    {
      slug: 'localized-categories',
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
          collection: 'localized-posts',
          on: 'category',
          localized: true,
        },
      ],
    },
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
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

    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'Test Post 1',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'Test Post 2',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'Test Post 3',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
