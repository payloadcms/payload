import type { CollectionConfig } from 'payload'
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'slug',
    },
    {
      name: 'requiredSlug',
      type: 'slug',
      useAsSlug: 'requiredTitle',
      required: true,
      unique: false,
      admin: { position: 'main' },
    },
  ],
}
