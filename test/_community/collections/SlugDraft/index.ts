import type { CollectionConfig } from 'payload'

export const slugDraftSlug = 'slug-draft'

export const SlugDraftCollection: CollectionConfig = {
  slug: slugDraftSlug,
  labels: { singular: 'Draft (non-autosave)', plural: 'Drafts (non-autosave)' },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
  ],
  versions: {
    drafts: true,
  },
}
