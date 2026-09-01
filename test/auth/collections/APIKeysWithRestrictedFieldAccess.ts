import type { CollectionConfig } from 'payload'

import { apiKeysWithRestrictedFieldAccessSlug } from '../shared.js'

export const APIKeysWithRestrictedFieldAccess: CollectionConfig = {
  slug: apiKeysWithRestrictedFieldAccessSlug,
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        read: () => false,
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        create: () => false,
        read: () => false,
        update: () => Promise.resolve(false),
      },
    },
  ],
  labels: {
    plural: 'API Keys With Restricted Field Access',
    singular: 'API Key With Restricted Field Access',
  },
  versions: false,
}
