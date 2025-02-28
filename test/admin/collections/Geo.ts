import type { CollectionConfig } from 'payload'

import { geoCollectionSlug } from '../slugs.js'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            actions: ['/components/actions/CollectionAPIButton/index.js#CollectionAPIButton'],
          },
          default: {
            actions: ['/components/actions/CollectionEditButton/index.js#CollectionEditButton'],
          },
        },
        list: {
          actions: ['/components/actions/CollectionListButton/index.js#CollectionListButton'],
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
