import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// BUG: wildcard csrf allows any origin to send cookie-authenticated requests,
// which defeats the purpose of CSRF protection entirely.
export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  serverURL: 'https://api.myapp.com',
  csrf: ['*'], // BUG: should list specific trusted frontend origins, not '*'
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
  ],
})
