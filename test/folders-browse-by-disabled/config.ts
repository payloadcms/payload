import { fileURLToPath } from 'node:url'
import path from 'path'
import { createFolderField, createFoldersCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { postSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const folderSlug = 'payload-folders'

const Posts = {
  slug: postSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ fieldName: 'folder', relationTo: folderSlug }),
  ],
} as const

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    createFoldersCollection({
      slug: folderSlug,
      fields: [{ name: 'name', type: 'text', required: true }],
      useAsTitle: 'name',
      hierarchy: {
        joinField: { fieldName: 'documentsAndFolders' },
        parentFieldName: 'folder',
      },
    }),
    Posts,
  ],
  globals: [
    {
      slug: 'global',
      fields: [
        {
          name: 'title',
          type: 'text',
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
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
