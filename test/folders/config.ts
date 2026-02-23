import { fileURLToPath } from 'node:url'
import path from 'path'
import { createFolderCollection, createTaxonomyCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Autosave } from './collections/Autosave/index.js'
import { Drafts } from './collections/Drafts/index.js'
import { Media } from './collections/Media/index.js'
import { OmittedFromBrowseBy } from './collections/OmittedFromBrowseBy/index.js'
import { Posts } from './collections/Posts/index.js'
import { TranslatedLabels } from './collections/TranslatedLabels/index.js'
import { seed } from './seed.js'
import { folderSlug, taxonomySlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    createFolderCollection({
      slug: folderSlug,
      useAsTitle: 'name',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'folderSlug', type: 'text' },
      ],
      folder: {
        collectionSpecific: false,
      },
    }),
    createTaxonomyCollection({
      slug: taxonomySlug,
      useAsTitle: 'name',
      fields: [{ name: 'name', type: 'text', required: true }],
      taxonomy: {},
    }),
    Posts,
    Media,
    Drafts,
    Autosave,
    OmittedFromBrowseBy,
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
