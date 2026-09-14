import type { CollectionConfig } from 'payload'

import { apiKeysSlug, restrictedRelationshipsSlug } from '../shared.js'

export const APIKeys: CollectionConfig = {
  slug: apiKeysSlug,
  auth: {
    depth: 1,
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'restrictedField',
      type: 'text',
      access: {
        read: () => false,
      },
    },
    {
      name: 'restrictedRelationship',
      type: 'relationship',
      relationTo: restrictedRelationshipsSlug,
    },
  ],
  hooks: {
    afterRead: [
      ({ doc, req }) => ({
        ...doc,
        authReadHookFallbackLocale: req.fallbackLocale,
        authReadHookLocale: req.locale,
        authReadHookRan: doc.restrictedField === 'restricted value',
        authReadHookRelationshipValue:
          doc.restrictedRelationship && typeof doc.restrictedRelationship === 'object'
            ? doc.restrictedRelationship.publicField
            : undefined,
      }),
    ],
  },
}
