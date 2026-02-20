import path from 'path'

import { relationshipsAsObjectID } from '../../packages/plugin-relationship-object-ids/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'

export default buildConfigWithDefaults({
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          name: 'featuredPost',
          type: 'relationship',
          relationTo: 'posts',
        },
      ],
    },
  ],
  collections: [
    {
      slug: 'uploads',
      upload: true,
      fields: [],
    },
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: 'relations',
      fields: [
        {
          name: 'hasOne',
          type: 'relationship',
          relationTo: 'posts',
          filterOptions: ({ id }) => ({ id: { not_equals: id } }),
        },
        {
          name: 'hasOnePoly',
          type: 'relationship',
          relationTo: ['pages', 'posts'],
        },
        {
          name: 'hasMany',
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
        },
        {
          name: 'hasManyPoly',
          type: 'relationship',
          relationTo: ['pages', 'posts'],
          hasMany: true,
        },
        {
          name: 'upload',
          type: 'upload',
          relationTo: 'uploads',
        },
      ],
    },
  ],
  plugins: [relationshipsAsObjectID()],
  onInit: async (payload) => {
    if (payload.db.name === 'mongoose') {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })

      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'page',
        },
      })

      const post1 = await payload.create({
        collection: 'posts',
        data: {
          title: 'post 1',
        },
      })

      const post2 = await payload.create({
        collection: 'posts',
        data: {
          title: 'post 2',
        },
      })

      const upload = await payload.create({
        collection: 'uploads',
        data: {},
        filePath: path.resolve(__dirname, './payload-logo.png'),
      })

      await payload.create({
        collection: 'relations',
        depth: 0,
        data: {
          hasOne: post1.id,
          hasOnePoly: { relationTo: 'pages', value: page.id },
          hasMany: [post1.id, post2.id],
          hasManyPoly: [
            { relationTo: 'posts', value: post1.id },
            { relationTo: 'pages', value: page.id },
          ],
          upload: upload.id,
        },
      })

      await payload.create({
        collection: 'relations',
        depth: 0,
        data: {
          hasOnePoly: { relationTo: 'pages', value: page.id },
        },
      })
    }
  },
})
