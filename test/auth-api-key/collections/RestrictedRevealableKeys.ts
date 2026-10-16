import type { CollectionConfig } from 'payload'

import { restrictedRevealableKeysSlug } from '../shared.js'

export const RestrictedRevealableKeys: CollectionConfig = {
  slug: restrictedRevealableKeysSlug,
  access: {
    read: ({ req }) => (req.user ? { denyCollectionReadAccess: { not_equals: true } } : false),
    update: ({ req }) => (req.user ? { denyCollectionUpdateAccess: { not_equals: true } } : false),
  },
  auth: {
    disableLocalStrategy: true,
    useAPIKey: { reveal: true },
  },
  fields: [
    {
      name: 'apiKey',
      type: 'text',
      access: {
        update: ({ doc }) =>
          doc?.denyAPIKeyUpdateAccess !== true && typeof doc?.apiKey === 'undefined',
      },
    },
    {
      name: 'denyCollectionReadAccess',
      type: 'checkbox',
      admin: { hidden: true },
    },
    {
      name: 'denyAPIKeyUpdateAccess',
      type: 'checkbox',
      admin: { hidden: true },
    },
    {
      name: 'denyCollectionUpdateAccess',
      type: 'checkbox',
      admin: { hidden: true },
    },
  ],
  versions: {
    drafts: true,
  },
}
