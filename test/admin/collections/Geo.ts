import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CollectionAPIButton from '../components/CollectionAPIButton'
import CollectionEditButton from '../components/CollectionEditButton'
import CollectionListButton from '../components/CollectionListButton'
import CollectionVersionButton from '../components/CollectionVersionButton'
import CollectionVersionsButton from '../components/CollectionVersionsButton'
import { geoCollectionSlug } from '../slugs'

export const Geo: CollectionConfig = {
  slug: geoCollectionSlug,
  versions: {
    drafts: true,
  },
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
          Version: {
            actions: [CollectionVersionButton],
          },
          Versions: {
            actions: [CollectionVersionsButton],
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
