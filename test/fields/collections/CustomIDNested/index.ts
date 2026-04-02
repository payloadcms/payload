import type { CollectionConfig } from 'payload'

import { customIDNestedSlug } from '../../slugs.js'

export const CustomIDNested: CollectionConfig = {
  slug: customIDNestedSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'id',
              type: 'number',
              admin: {
                description: 'Custom numeric ID nested in an unnamed tab',
              },
              defaultValue: () => Math.floor(Math.random() * 1000000),
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
          ],
          label: 'Main',
        },
      ],
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
