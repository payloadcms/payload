import type { CollectionConfig } from 'payload'

import { restrictedTabsSlug } from '../../shared.js'

export const RestrictedTabsCollection: CollectionConfig = {
  slug: restrictedTabsSlug,
  admin: {
    useAsTitle: 'title',
  },
  authorship: false,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'noUpdate',
      type: 'text',
      access: {
        update: () => false,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'namedTab',
          fields: [
            {
              name: 'namedTabText',
              type: 'text',
              label: 'Named Tab Field',
            },
          ],
        },
      ],
    },
  ],
  versions: false,
}
