import { fileURLToPath } from 'node:url'
import path from 'path'
import { createCreatedByField, createUpdatedByField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  adminsSlug,
  createdOnlySlug,
  customAuthorshipSlug,
  draftPostsSlug,
  menuSlug,
  noAuthorshipSlug,
  postsSlug,
  rawAuthorshipSlug,
  updatedOnlySlug,
  usersSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults(
  {
    collections: [
      {
        slug: usersSlug,
        auth: true,
        access: {
          // Users can only read their own record — used to verify that authorship
          // relationships fall back to an id reference when the reader lacks access.
          read: ({ req: { user } }) => (user ? { id: { equals: user.id } } : false),
        },
        fields: [],
        // Auth-session writes on login churn version docs, which flakes on Atlas with
        // "catalog changes" errors; auth records don't need versioning here.
        versions: false,
      },
      {
        slug: adminsSlug,
        auth: true,
        fields: [],
        versions: false,
      },
      {
        // Default authorship: both createdBy and updatedBy
        slug: postsSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        // Drafts enabled so the version compare (diff) view can be exercised in e2e
        slug: draftPostsSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        versions: {
          drafts: true,
        },
      },
      {
        // Authorship disabled entirely
        slug: noAuthorshipSlug,
        authorship: false,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        // Only createdBy tracked
        slug: createdOnlySlug,
        authorship: { updatedBy: false },
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        versions: {
          drafts: true,
        },
      },
      {
        // Only updatedBy tracked
        slug: updatedOnlySlug,
        authorship: { createdBy: false },
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        versions: {
          drafts: true,
        },
      },
      {
        // Both authorship fields customized via the exported builders (unhidden + relabelled)
        // while the stamping hooks are preserved.
        slug: customAuthorshipSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          createCreatedByField({
            overrides: {
              admin: { hidden: false },
              label: 'Author',
            },
          }),
          createUpdatedByField({
            overrides: {
              admin: { hidden: false },
              label: 'Editor',
            },
          }),
        ],
      },
      {
        // A raw user-defined createdBy (NOT via the builders): accepted as-is, so it gets no
        // stamping hooks and no anti-spoof access. updatedBy is still auto-injected.
        slug: rawAuthorshipSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'createdBy',
            type: 'relationship',
            // Left empty to verify sanitization backfills the auth collections.
            relationTo: [],
          },
        ],
      },
    ],
    globals: [
      {
        // Default authorship on a global
        slug: menuSlug,
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
        collection: usersSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      // A second user used by access-control tests; `users` read is restricted to own record.
      await payload.create({
        collection: usersSlug,
        data: {
          email: 'other@payloadcms.com',
          password: devUser.password,
        },
      })
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  {
    disableAutoLogin: true,
  },
)
