import type { CollectionConfig } from 'payload'

export const slugAutosaveSlug = 'slug-autosave'

export const SlugFieldAutosave: CollectionConfig = {
  slug: slugAutosaveSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
  ],
  versions: {
    drafts: { autosave: true },
  },
}
