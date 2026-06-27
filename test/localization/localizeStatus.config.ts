import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
      versions: false,
    },
    {
      slug: 'testMigrationPosts',
      fields: [
        {
          name: 'title',
          type: 'text',
          // NOT localized - so no locales table for versions will be created
        },
      ],
      versions: {
        drafts: true,
      },
    },
    {
      slug: 'testMigrationArticles',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true, // This WILL create a locales table
        },
      ],
      versions: {
        drafts: true,
      },
    },
    {
      slug: 'testNoVersions',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      // Explicitly disabled — migration should skip collections without versions
      versions: false,
    },
    // Joined draft collection sorted by a localized field (`_status`) — repros #15248.
    {
      slug: 'joinOrgs',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'repos', type: 'join', collection: 'joinRepos', on: 'org' },
      ],
      versions: { drafts: true },
    },
    {
      slug: 'joinRepos',
      defaultSort: ['_status', '-updatedAt'],
      fields: [
        { name: 'org', type: 'relationship', relationTo: 'joinOrgs' },
        { name: 'title', type: 'text', localized: true },
      ],
      versions: { drafts: true },
    },
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'localizeStatus-payload-types.ts'),
  },
})
