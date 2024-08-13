import type { CollectionConfig } from 'payload'

import { geoCollectionSlug } from '../slugs.js'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            actions: ['/components/CollectionAPIButton/index.js#CollectionAPIButton'],
          },
          default: {
            actions: ['/components/CollectionEditButton/index.js#CollectionEditButton'],
          },
        },
        list: {
          actions: ['/components/CollectionListButton/index.js#CollectionListButton'],
        },
      },
    },
  },
  fields: [
    {
      name: 'point',
      type: 'point',
    },
  ],
}
