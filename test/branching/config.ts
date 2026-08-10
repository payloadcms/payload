import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  mediaSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  restrictedSlug,
  uniqueSlug,
  whereAccessSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  branching: true,
  collections: [
    {
      slug: postsSlug,
      hooks: {
        afterChange: [(args) => hookSpy.afterChange?.(args)],
        beforeChange: [(args) => hookSpy.beforeChange?.(args)],
      },
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
      fields: [
        { name: 'name', type: 'text' },
        { name: 'posts', type: 'join', collection: postsSlug, on: 'category' },
      ],
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
      // Access depends on who is asking, so merge must evaluate it as the
      // merging user rather than the branch author.
      slug: restrictedSlug,
      access: {
        update: ({ req }) => req.user?.email === devUser.email,
      },
      fields: [{ name: 'title', type: 'text' }],
      versions: false,
    },
    {
      // Where-returning access, to exercise tier 2 of the preflight.
      slug: whereAccessSlug,
      access: {
        update: () => ({ mergeable: { equals: true } }),
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'mergeable', type: 'checkbox' },
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
  globals: [
    {
      slug: headerGlobalSlug,
      fields: [{ name: 'navLabel', type: 'text' }],
      versions: false,
    },
    {
      slug: homepageGlobalSlug,
      fields: [{ name: 'heroTitle', type: 'text' }],
      versions: { drafts: true },
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
