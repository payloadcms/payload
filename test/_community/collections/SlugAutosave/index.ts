import type { CollectionConfig } from 'payload'

export const slugAutosaveSlug = 'slug-autosave'

export const SlugAutosaveCollection: CollectionConfig = {
  slug: slugAutosaveSlug,
  labels: { singular: 'Autosave', plural: 'Autosaves' },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 150,
      },
    },
  },
}
