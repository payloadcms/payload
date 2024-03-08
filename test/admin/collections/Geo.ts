import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

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
          Default: {
            actions: [CollectionEditButton],
          },
          API: {
            actions: [CollectionAPIButton],
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
