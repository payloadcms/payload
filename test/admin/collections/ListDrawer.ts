import type { CollectionConfig } from 'payload'

import { isRSCEnabled } from 'payload/shared'

import { listDrawerSlug } from '../slugs.js'

export const ListDrawer: CollectionConfig = {
  slug: listDrawerSlug,
  admin: {
    components: {
      ...(isRSCEnabled()
        ? {
            beforeListTable: [
              {
                path: '/components/BeforeList/index.js#SelectPostsButton',
              },
            ],
          }
        : {}),
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
  ],
  versions: false,
}
