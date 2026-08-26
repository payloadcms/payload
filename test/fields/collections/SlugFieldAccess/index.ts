import type { CollectionConfig } from 'payload'

export const slugFieldAccessSlug = 'slug-field-access'

export const SlugFieldAccess: CollectionConfig = {
  slug: slugFieldAccessSlug,
  access: {
    create: () => true,
    read: () => false,
    update: () => true,
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', unique: false, useAsSlug: 'title' },
    { name: 'localizedTitle', type: 'text', localized: true },
    {
      name: 'localizedSlug',
      type: 'slug',
      localized: true,
      unique: false,
      useAsSlug: 'localizedTitle',
    },
    { name: 'sourcelessSlug', type: 'slug', unique: false },
  ],
}
