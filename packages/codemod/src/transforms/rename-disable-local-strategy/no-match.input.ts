import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
    tokenExpiration: 3600,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}

// A `disableLocalStrategy` key on an unrelated object should also be left alone —
// but this transform is intentionally broad and rewrites any occurrence, so we
// only assert no-op behavior when the property isn't present at all.
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [],
}
