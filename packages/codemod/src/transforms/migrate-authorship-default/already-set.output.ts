import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [],
  authorship: {
    updatedBy: false,
  },
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [],
  authorship: false,
}
