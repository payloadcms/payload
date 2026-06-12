import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// BUG: loginWithUsername is set to true (shorthand) but allowEmailLogin is not
// configured. Users can only log in with username — email fallback is disabled.
// Fix this so users can log in with either username OR email.
export default buildConfig({
  collections: [
    {
      slug: 'customers',
      auth: {
        loginWithUsername: true,
      },
      fields: [
        {
          name: 'username',
          type: 'text',
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
