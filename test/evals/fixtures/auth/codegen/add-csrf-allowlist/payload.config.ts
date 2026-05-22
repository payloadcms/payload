import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  serverURL: 'https://my-payload-app.com',
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
  ],
})
