import type { CollectionConfig } from 'payload'

import { apiKeysWithHiddenKeysSlug } from '../shared.js'

export const APIKeysWithHiddenKeys: CollectionConfig = {
  slug: apiKeysWithHiddenKeysSlug,
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        read: () => false,
      },
    },
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        read: () => true,
      },
    },
  ],
  labels: {
    plural: 'API Keys With Hidden Keys',
    singular: 'API Key With Hidden Key',
  },
  versions: false,
}
