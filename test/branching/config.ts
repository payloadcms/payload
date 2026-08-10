import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  categoriesSlug,
  excludedSlug,
  mediaSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  uniqueSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  branching: true,
  collections: [
    {
      slug: postsSlug,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'category', type: 'relationship', relationTo: categoriesSlug },
      ],
      versions: false,
    },
    {
      slug: pagesSlug,
      fields: [{ name: 'title', type: 'text' }],
      versions: { drafts: true },
    },
    {
      slug: categoriesSlug,
      fields: [{ name: 'name', type: 'text' }],
      versions: false,
    },
    {
      slug: mediaSlug,
      fields: [{ name: 'alt', type: 'text' }],
      upload: { staticDir: path.resolve(dirname, 'media') },
      versions: false,
    },
    {
      slug: uniqueSlug,
      fields: [{ name: 'slug', type: 'text', unique: true }],
      versions: false,
    },
    {
      // Verifies `_branchDocID` inherits a non-default ID type.
      slug: numericIDSlug,
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'title', type: 'text' },
      ],
      versions: false,
    },
    {
      slug: excludedSlug,
      branching: false,
      fields: [{ name: 'title', type: 'text' }],
      versions: false,
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
