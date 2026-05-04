import type { CollectionConfig } from 'payload'

import { noApiViewCollectionSlug } from '../slugs.js'

export const CollectionNoApiView: CollectionConfig = {
  slug: noApiViewCollectionSlug,
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
