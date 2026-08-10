import { buildConfig } from 'payload'

// localizeStatus: false should be preserved (explicit opt-out)
export default buildConfig({
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
