import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      access: {
        // BUG: crashes during Access Operation — id is undefined when admin panel loads
        read: ({ id, req: { user } }) => {
          if (user?.roles?.includes('admin')) {
            return true
          }
          // id.startsWith is called without guarding undefined
          return (id as string).startsWith('pub-')
        },
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
