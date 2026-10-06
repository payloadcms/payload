import type { GlobalConfig } from '../../globals/config/types.js'

export const migrationsLockGlobal: GlobalConfig = {
  slug: 'payload-migrations-lock',
  admin: {
    hidden: true,
  },
  authorship: false,
  endpoints: false,
  fields: [
    {
      name: 'lock_key',
      type: 'text',
      defaultValue: 'payload-migrations-lock',
      required: true,
      unique: true,
    },
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
  lockDocuments: false,
  versions: false,
}
