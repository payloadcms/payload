import type { GlobalConfig } from '../../globals/config/types.js'

export const migrationsLockGlobal: GlobalConfig = {
  slug: 'payload-migrations-lock',
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [
    {
      name: 'locked',
      type: 'checkbox',
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
