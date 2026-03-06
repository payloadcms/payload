import type { CollectionConfig } from 'payload'

export const pagesSlug = 'pages'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
    groupBy: true,
  },
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
