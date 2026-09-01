import type { CollectionConfig } from 'payload'

import { apiKeysSlug, apiKeysWithReadableKeysSlug, restrictedRelationshipsSlug } from '../shared.js'

export const APIKeysWithReadableKeys: CollectionConfig = {
  slug: apiKeysWithReadableKeysSlug,
  access: {
    read: ({ req: { user } }) => {
      if (!user) {
        return false
      }
      if (user.collection === apiKeysWithReadableKeysSlug) {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return true
    },
  },
  auth: {
    depth: 1,
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  disableDuplicate: false,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'peer',
      type: 'relationship',
      relationTo: restrictedRelationshipsSlug,
    },
    {
      name: 'apiKeyPeer',
      type: 'relationship',
      relationTo: apiKeysSlug,
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        read: () => true,
      },
    },
  ],
  labels: {
    plural: 'API Keys With Readable Keys',
    singular: 'API Key With Readable Key',
  },
  versions: false,
}
