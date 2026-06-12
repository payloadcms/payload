import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'users',
      auth: {
        cookies: {
          sameSite: 'Lax',
          secure: false,
        },
      },
      fields: [],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
