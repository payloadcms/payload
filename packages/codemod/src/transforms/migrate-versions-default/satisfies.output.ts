import type { CollectionConfig } from 'payload'

export const Posts = {
  slug: 'posts',
  fields: [],
  versions: false,
} satisfies CollectionConfig

export const Media = {
  slug: 'media',
  fields: [],
  upload: true,
  versions: false,
} satisfies CollectionConfig
