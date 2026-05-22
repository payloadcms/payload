import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      access: {
        // BUG: crashes when no user is logged in — req.user is null for public requests
        read: ({ req }) => req.user.role === 'admin',
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
          name: 'role',
          type: 'select',
          options: ['admin', 'user'],
          defaultValue: 'user',
          saveToJWT: true,
        },
      ],
    },
  ],
})
