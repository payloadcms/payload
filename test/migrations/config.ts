import type { GlobalConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const migrationsLockGlobal: GlobalConfig = {
  slug: 'payload-migrations-lock',
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'locked_by',
      type: 'text',
    },
    {
      name: 'locked_at',
      type: 'date',
    },
    {
      name: 'expires_at',
      type: 'date',
    },
  ],
  graphQL: false,
}

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  globals: [migrationsLockGlobal],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
