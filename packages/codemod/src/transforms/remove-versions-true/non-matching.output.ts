import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [],
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [],
  versions: false,
}

const untyped = {
  slug: 'untyped',
  versions: true,
}
