import type { CollectionConfig } from 'payload'

export const Posts = {
  slug: 'posts',
  fields: [],
} satisfies CollectionConfig

export const Media = {
  slug: 'media',
  fields: [],
  upload: true,
} satisfies CollectionConfig
