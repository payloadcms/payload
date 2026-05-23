import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'users',
      auth: {
        tokenExpiration: 86400, // 24 hours
      },
      fields: [],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
