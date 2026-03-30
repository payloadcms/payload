import type { CollectionConfig } from 'payload'

import { serverURL } from '../../__helpers/shared/serverURL.js'
import { collectionLevelConfigSlug } from '../shared.js'

export const CollectionLevelConfig: CollectionConfig = {
  slug: collectionLevelConfigSlug,
  admin: {
    description: "Live Preview is enabled on this collection's own config, not the root config.",
    useAsTitle: 'title',
    livePreview: {
      url: `${serverURL}/live-preview`,
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
