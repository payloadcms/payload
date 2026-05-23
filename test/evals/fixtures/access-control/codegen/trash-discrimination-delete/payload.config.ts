import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'textarea' },
      ],
      trash: true,
    },
    {
      slug: 'users',
      auth: true,
      fields: [
        { name: 'name', type: 'text' },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['user'],
          hasMany: true,
          options: ['admin', 'user'],
          saveToJWT: true,
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
