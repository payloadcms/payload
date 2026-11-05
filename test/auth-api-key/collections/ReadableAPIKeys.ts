import type { Access, CollectionConfig } from 'payload'

import { readableAPIKeysSlug } from '../shared.js'

const isLoggedIn: Access = ({ req }) => Boolean(req.user)

export const ReadableAPIKeys: CollectionConfig = {
  slug: readableAPIKeysSlug,
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    // Mirrors the documented `apiKey` / `enableAPIKey` access override, with `apiKey` also readable
    {
      name: 'apiKey',
      type: 'text',
      access: {
        create: isLoggedIn,
        read: isLoggedIn,
        update: isLoggedIn,
      },
    },
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        create: isLoggedIn,
        update: isLoggedIn,
      },
    },
  ],
}
