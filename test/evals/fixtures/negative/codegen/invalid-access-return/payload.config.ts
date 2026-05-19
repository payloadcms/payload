import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      // Bug: access function returns a string instead of a boolean or where-constraint
      access: {
        read: ({ req }) => (req.user ? 'yes' : 'no'),
      },
      fields: [{ name: 'title', type: 'text' }],
    },
  ],
})
