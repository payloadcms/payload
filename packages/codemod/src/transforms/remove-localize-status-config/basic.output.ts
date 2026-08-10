import { buildConfig } from 'payload'

// Before: explicit localizeStatus: true in drafts config and experimental block
export default buildConfig({
  collections: [
    {
      slug: 'posts',
      versions: {
        drafts: {
          autosave: false,
        },
      },
      fields: [{ name: 'title', type: 'text', localized: true }],
    },
  ],
})
