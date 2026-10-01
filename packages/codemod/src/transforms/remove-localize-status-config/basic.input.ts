import { buildConfig } from 'payload'

// Before: explicit localizeStatus: true in drafts config and experimental block
export default buildConfig({
  experimental: {
    localizeStatus: true,
  },
  collections: [
    {
      slug: 'posts',
      versions: {
        drafts: {
          localizeStatus: true,
          autosave: false,
        },
      },
      fields: [{ name: 'title', type: 'text', localized: true }],
    },
  ],
})
