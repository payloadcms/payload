import type { CollectionConfig } from 'payload'

import { customCollectionViewSlug } from '../slugs.js'

export const CustomCollectionView: CollectionConfig = {
  slug: customCollectionViewSlug,
  admin: {
    components: {
      views: {
        grid: {
          Component: '/components/views/CustomCollectionView/index.js#CustomCollectionView',
          path: '/grid',
          exact: true,
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
