import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { pagesSlug } from '../shared'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'text',
    },
  ],
}
