import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { buildMCPEvalConfig } from '../buildMCPEvalConfig.js'

export default buildMCPEvalConfig({
  collections: [
    {
      slug: 'authors',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'relationship', relationTo: 'authors' },
        { name: 'content', type: 'richText' },
      ],
    },
    {
      slug: 'articles',
      fields: [{ name: 'title', type: 'text', localized: true, required: true }],
      versions: { drafts: true },
    },
  ],
  editor: lexicalEditor({}),
  globals: [
    {
      slug: 'site-settings',
      fields: [{ name: 'tagline', type: 'text', defaultValue: 'Original tagline' }],
    },
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  mcp: {
    collections: {
      articles: {},
      authors: {},
      posts: {},
    },
    globals: {
      'site-settings': {},
    },
  },
})
