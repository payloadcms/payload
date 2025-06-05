import type { CollectionConfig } from 'payload'

import { viewConditionsCollectionSlug } from '../slugs.js'

export const ViewConditions: CollectionConfig = {
  slug: viewConditionsCollectionSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            condition: ({ user, doc }) => {
              const trueTitle = doc?.title === 't'
              if (user?.roles?.includes('admin') || trueTitle) {
                return true
              } else {
                return false
              }
            },
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
