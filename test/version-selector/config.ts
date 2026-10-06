import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { LocalizedPlainPosts } from './collections/localized-plain-posts.js'
import { LocalizedPosts } from './collections/localized-posts.js'
import { PlainPosts } from './collections/plain-posts.js'
import { Posts } from './collections/posts.js'
import { draftPostsSlug, plainGlobalSlug } from './slugs.js'

export default buildConfigWithDefaults({
  config: {
    typescript: { autoGenerate: false },
    collections: [Posts, LocalizedPosts, PlainPosts, LocalizedPlainPosts],
    globals: [
      {
        slug: plainGlobalSlug,
        access: { read: () => true, update: () => true },
        fields: [{ name: 'title', type: 'text', localized: true }],
      },
      {
        slug: 'version-selector-global',
        access: {
          read: () => true,
          update: ({ req }) =>
            req.context.versionUpdateTitle
              ? { title: { equals: req.context.versionUpdateTitle as string } }
              : true,
        },
        fields: [
          { name: 'title', type: 'text', localized: true, required: true },
          { name: 'summary', type: 'text' },
          { name: 'related', type: 'relationship', relationTo: draftPostsSlug },
        ],
        versions: { drafts: { localizeStatus: true } },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  suite: 'version-selector',
})
