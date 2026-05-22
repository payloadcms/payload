import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      versions: {
        drafts: true,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'textarea' },
      ],
    },
    {
      slug: 'users',
      auth: true,
      fields: [
        { name: 'name', type: 'text' },
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: ['admin', 'editor', 'user'],
          defaultValue: ['user'],
          saveToJWT: true,
        },
      ],
    },
  ],
})
