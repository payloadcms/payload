import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      access: {
        // BUG: crashes when no user is logged in — req.user is null for public requests
        read: ({ req }) => (req.user as unknown as { role: string }).role === 'admin',
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
          defaultValue: 'user',
          options: ['admin', 'user'],
          saveToJWT: true,
        },
      ],
    },
  ],
  db: stubAdapter,
  secret: 'eval-fixture',
})
