import type { CollectionConfig } from 'payload'

import { editListViewSlug, postsCollectionSlug, uploadCollectionSlug } from '../slugs.js'

export const EditListItems: CollectionConfig = {
  slug: editListViewSlug,
  admin: {
    components: {
      edit: {
        editMenuItems: [
          {
            path: '/components/EditMenuItems/index.js#EditMenuItems',
          },
        ],
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
