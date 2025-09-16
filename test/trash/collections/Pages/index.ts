import type { CollectionConfig } from 'payload'

export const pagesSlug = 'pages'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  trash: false, // Soft deletes are not enabled for this collection
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
