import type { CollectionConfig } from 'payload'

import { customTabIDSlug } from '../../slugs.js'

export const CustomTabID: CollectionConfig = {
  slug: customTabIDSlug,
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'id',
              type: 'text',
            },
          ],
          label: 'Tab 1',
        },
      ],
    },
  ],
  labels: {
    plural: 'Custom Tab IDs',
    singular: 'Custom Tab ID',
  },
}
