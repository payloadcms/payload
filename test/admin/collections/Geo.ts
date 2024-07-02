import type { CollectionConfig } from 'payload'

import { CollectionAPIButton } from '../components/CollectionAPIButton/index.js'
import { CollectionEditButton } from '../components/CollectionEditButton/index.js'
import { CollectionListButton } from '../components/CollectionListButton/index.js'
import { geoCollectionSlug } from '../slugs.js'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  admin: {
    components: {
      views: {
        Edit: {
          API: {
            actions: [CollectionAPIButton],
          },
          Default: {
            actions: [CollectionEditButton],
          },
        },
        List: {
          actions: [CollectionListButton],
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
