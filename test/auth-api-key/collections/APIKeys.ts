import type { CollectionConfig } from 'payload'

import { apiKeysSlug } from '../shared.js'

export const APIKeys: CollectionConfig = {
  slug: apiKeysSlug,
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  labels: {
    plural: 'API Keys',
    singular: 'API Key',
  },
}
