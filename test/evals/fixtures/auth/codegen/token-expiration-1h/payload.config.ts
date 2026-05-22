import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'users',
      auth: {
        tokenExpiration: 86400, // 24 hours
      },
      fields: [],
    },
  ],
})
