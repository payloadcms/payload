import type { CollectionConfig } from '../../collections/config/types.js'

export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  // Only the migration CLI and the dev push touch this collection, through
  // the Local API with `overrideAccess: true`; nothing reads or writes it
  // with access enforced. Without this, the default access applies and
  // `/api/access` reports every operation as allowed for any admin user.
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: {
    hidden: true,
  },
  authorship: false,
  endpoints: false,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'batch',
      type: 'number',
      // NOTE: This value is -1 if it is a "dev push"
    },
  ],
  graphQL: false,
  lockDocuments: false,
  versions: false,
}
