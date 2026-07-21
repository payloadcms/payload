import type { CollectionConfig } from 'payload'

export const slugDraftSlug = 'slug-draft'

export const SlugFieldDraft: CollectionConfig = {
  slug: slugDraftSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
  ],
  versions: {
    drafts: true,
  },
}
