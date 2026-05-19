import type { CollectionConfig } from 'payload'

import { noApiViewCollectionSlug } from '../slugs.js'

export const CollectionNoApiView: CollectionConfig = {
  slug: noApiViewCollectionSlug,
  labels: {
    singular: 'No API View',
    plural: 'No API View',
  },
  admin: {
    components: {
      views: {
        edit: {
          api: {
            tab: {
              condition: () => false,
            },
          },
        },
      },
    },
  },
  fields: [],
}
