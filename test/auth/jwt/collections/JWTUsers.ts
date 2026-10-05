import type { CollectionConfig } from 'payload'

import { jwtUsersSlug, restrictedRelationshipsSlug } from '../../shared.js'

export const JWTUsers: CollectionConfig = {
  slug: jwtUsersSlug,
  access: {
    read: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
  },
  auth: {
    depth: 1,
  },
  fields: [
    {
      name: 'restrictedField',
      type: 'text',
      access: {
        read: () => false,
      },
      saveToJWT: true,
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
        ...(req.headers.get('x-auth-transform-jwt') === 'true' && doc.restrictedField
          ? { restrictedField: 'transformed value' }
          : {}),
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
