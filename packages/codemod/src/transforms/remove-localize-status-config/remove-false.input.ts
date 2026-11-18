import { buildConfig } from 'payload'

// localizeStatus: false is no longer a supported opt-out
export default buildConfig({
  experimental: {
    localizeStatus: false,
  },
  collections: [
    {
      slug: 'posts',
      versions: {
        drafts: {
          localizeStatus: false,
        },
      },
      fields: [{ name: 'title', type: 'text', localized: true }],
    },
  ],
})
