import { fileURLToPath } from 'node:url'
import path from 'path'
import { createFoldersCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media/index.js'
import { Posts } from './collections/Posts/index.js'
import { TranslatedLabels } from './collections/TranslatedLabels/index.js'
import { seed } from './seed.js'
import { folderSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    createFoldersCollection({
      slug: folderSlug,
      useAsTitle: 'name',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'folderSlug', type: 'text' },
      ],
      hierarchy: {
        admin: {
          components: {
            Icon: {
              clientProps: { color: 'var(--theme-success-400)' },
              path: './components/ColoredFolderIcon.tsx#ColoredFolderIcon',
            },
          },
        },
        collectionSpecific: { fieldName: 'folderType' },
        joinField: { name: 'documentsAndFolders' },
        parentFieldName: 'folder',
      },
    }),
    Posts,
    Media,
    TranslatedLabels,
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
    await seed(payload)
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
