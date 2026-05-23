import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

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
        {
          name: 'content',
          // Wrong: should be 'richText' with a lexicalEditor, not plain 'text'
          type: 'text',
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
