import type { CollectionConfig } from 'payload'

import { collectionSlugs } from '../../shared.js'

export const TabErrorReset: CollectionConfig = {
  slug: collectionSlugs.tabErrorReset,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'errorTab',
          fields: [
            {
              name: 'requiredInTab',
              type: 'text',
              required: true,
            },
          ],
          label: 'Error Tab',
        },
      ],
    },
  ],
  versions: false,
}
