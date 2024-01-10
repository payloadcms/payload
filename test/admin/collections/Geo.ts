import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CollectionAPIButton from '../components/CollectionAPIButton'
import CollectionEditButton from '../components/CollectionEditButton'
import CollectionListButton from '../components/CollectionListButton'
import { geoCollectionSlug } from '../slugs'

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
