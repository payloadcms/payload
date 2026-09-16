import type { CollectionConfig } from 'payload'

import { adminUsersSlug, apiKeysSlug, restrictedRelationshipsSlug } from '../shared.js'

export const APIKeys: CollectionConfig = {
  slug: apiKeysSlug,
  access: {
    update: ({ req }) =>
      req.user?.collection === adminUsersSlug && req.user.canUpdateAPIKeys === true,
  },
  auth: {
    depth: 1,
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'apiKey',
      type: 'text',
      access: {
        create: ({ req }) =>
          req.user?.collection === adminUsersSlug && req.user.canManageAPIKeys === true,
        update: ({ req }) =>
          req.user?.collection === adminUsersSlug && req.user.canManageAPIKeys === true,
      },
    },
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
        authReadHookHasAPIKey: Object.prototype.hasOwnProperty.call(doc, 'apiKey'),
        authReadHookHasAPIKeyIndex: Object.prototype.hasOwnProperty.call(doc, 'apiKeyIndex'),
        authReadHookLocale: req.locale,
        authReadHookRan: doc.restrictedField === 'restricted value',
        authReadHookRelationshipValue:
          doc.restrictedRelationship && typeof doc.restrictedRelationship === 'object'
            ? doc.restrictedRelationship.publicField
            : undefined,
      }),
    ],
    beforeRead: [
      ({ doc }) => ({
        ...doc,
        authBeforeReadHookHasAPIKey: Object.prototype.hasOwnProperty.call(doc, 'apiKey'),
        authBeforeReadHookHasAPIKeyIndex: Object.prototype.hasOwnProperty.call(doc, 'apiKeyIndex'),
      }),
    ],
  },
  versions: true,
}
