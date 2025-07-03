import type { CollectionConfig } from 'payload'

import { collectionLevelConfigSlug } from '../shared.js'
import { formatLivePreviewURL } from '../utilities/formatLivePreviewURL.js'

export const CollectionLevelConfig: CollectionConfig = {
  slug: collectionLevelConfigSlug,
  admin: {
    description: "Live Preview is enabled on this collection's own config, not the root config.",
    useAsTitle: 'title',
    livePreview: {
      url: formatLivePreviewURL,
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
