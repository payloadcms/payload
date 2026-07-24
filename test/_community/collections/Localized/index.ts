import type { CollectionConfig } from 'payload'

export const localizedSlug = 'localized'

export const LocalizedCollection: CollectionConfig = {
  slug: localizedSlug,
  labels: { singular: 'Localized Slug', plural: 'Localized Slugs' },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'slug', type: 'slug', useAsSlug: 'title', localized: true },
  ],
  versions: {
    drafts: true,
  },
}
