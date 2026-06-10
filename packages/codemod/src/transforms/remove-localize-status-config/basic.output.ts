import { buildConfig } from 'payload'

// After: localizeStatus: true removed (auto-inferred), experimental block removed
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
