import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'customers',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'ssn', type: 'text' },
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
          options: ['admin', 'user'],
          defaultValue: ['user'],
          saveToJWT: true,
        },
      ],
    },
  ],
})
