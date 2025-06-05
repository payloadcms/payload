import type { CollectionConfig } from 'payload'

import { tabConditionsSlug } from '../slugs.js'

export const TabConditions: CollectionConfig = {
  slug: tabConditionsSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            condition: ({ user }) => {
              const isAdmin = 'roles' in user && user.roles && user?.roles?.includes('admin')
              if (isAdmin) {
                return true
              }
              return false
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
