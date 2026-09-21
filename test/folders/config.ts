import { fileURLToPath } from 'node:url'
import path from 'path'

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
  suite: 'folders',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: folderSlug,
        admin: {
          useAsTitle: 'name',
        },
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'folderSlug', type: 'text' },
        ],
        folders: {
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
        versions: false,
      },
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
        versions: false,
      },
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    await seed(payload)
  },
})
