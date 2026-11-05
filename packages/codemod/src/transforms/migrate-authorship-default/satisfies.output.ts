import type { CollectionConfig } from 'payload'

export const Posts = {
  slug: 'posts',
  fields: [],
  authorship: false,
} satisfies CollectionConfig

export const Media = {
  slug: 'media',
  fields: [],
  upload: true,
  authorship: false,
} satisfies CollectionConfig
