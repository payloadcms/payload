import { buildConfig } from 'payload'

// localizeStatus: false is no longer a supported opt-out
export default buildConfig({
  collections: [
    {
      slug: 'posts',
      versions: {
        drafts: {
        },
      },
      fields: [{ name: 'title', type: 'text', localized: true }],
    },
  ],
})
