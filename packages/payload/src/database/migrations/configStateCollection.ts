import type { CollectionConfig } from '../../collections/config/types.js'

export const configStateCollection: CollectionConfig = {
  slug: 'payload-config-state',
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [{ name: 'state', type: 'json', required: true }],
  graphQL: false,
  lockDocuments: false,
}
