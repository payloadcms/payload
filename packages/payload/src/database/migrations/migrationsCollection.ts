import type { CollectionConfig } from '../../collections/config/types.js'

export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  admin: {
    hidden: true,
  },
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
}
