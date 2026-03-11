import { buildConfig } from 'payload'

export default buildConfig({
  db: null as unknown as Parameters<typeof buildConfig>[0]['db'],
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'updatedAt', type: 'date' },
      ],
      // Bug: beforeChange hook mutates data but never returns it — changes are silently discarded
      hooks: {
        beforeChange: [
          ({ data }) => {
            data.updatedAt = new Date().toISOString()
          },
        ],
      },
    },
  ],
})
