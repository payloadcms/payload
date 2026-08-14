import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  autosaveSlug,
  branchesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  localizedSlug,
  maxVersionsSlug,
  mediaSlug,
  nestedSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
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
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'category', type: 'relationship', relationTo: categoriesSlug },
      ],
      hooks: {
        afterChange: [(args) => hookSpy.afterChange?.(args)],
        beforeChange: [(args) => hookSpy.beforeChange?.(args)],
      },
      versions: false,
    },
    {
      slug: pagesSlug,
      admin: { useAsTitle: 'title' },
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
      // The canonical public-site rule. A branch's copy of a published document
      // satisfies it too, which is what the branch gate exists to stop.
      slug: publicSlug,
      access: { read: () => ({ _status: { equals: 'published' } }) },
      admin: { useAsTitle: 'title' },
      fields: [{ name: 'title', type: 'text' }],
      versions: { drafts: true },
    },
    {
      // Two versions kept, so pruning happens on the third save. Pruning on a branch
      // must never reach main's chain.
      slug: maxVersionsSlug,
      admin: { useAsTitle: 'title' },
      fields: [{ name: 'title', type: 'text' }],
      versions: { drafts: true, maxPerDoc: 2 },
    },
    {
      // Autosave is the path into `updateLatestVersion`, which rewrites a version row
      // in place rather than appending one.
      slug: autosaveSlug,
      admin: { useAsTitle: 'title' },
      fields: [{ name: 'title', type: 'text' }],
      versions: { drafts: { autosave: { interval: 0 } } },
    },
    {
      // Localized fields fork per locale, and `_status` localization is what reaches the
      // version writes that were not branch-aware.
      slug: localizedSlug,
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'shared', type: 'text' },
      ],
      versions: { drafts: true },
    },
    {
      // Arrays and blocks live in their own tables under Drizzle, so a fork has to copy
      // child rows and re-parent them — a path no flat-field test can reach.
      slug: nestedSlug,
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text' },
        {
          name: 'items',
          type: 'array',
          fields: [{ name: 'label', type: 'text' }],
        },
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'hero',
              fields: [{ name: 'heading', type: 'text' }],
            },
          ],
        },
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
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })

    // Seeded so the branch switcher in the admin panel has something to switch
    // between as soon as `pnpm dev branching` comes up.
    for (const branch of [
      { name: 'Halloween Updates', slug: 'halloween-updates' },
      { name: 'Q4 Campaign', slug: 'q4-campaign' },
      { name: 'Pricing Refresh', slug: 'pricing-refresh' },
    ]) {
      await payload.create({
        collection: branchesSlug,
        data: { ...branch, status: 'open' },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
