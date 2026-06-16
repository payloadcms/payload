import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// This config intends to enable draft support on posts but the versions config
// is missing the drafts property. As a result, versions are tracked but drafts
// (and the _status field) are not enabled.
export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      versions: true, // BUG: should be { drafts: true } to enable draft support
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
