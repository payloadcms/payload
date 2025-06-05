import type { GlobalConfig } from 'payload'

import { notInViewGlobalSlug } from '../slugs.js'

export const ViewConditionsGlobal: GlobalConfig = {
  slug: notInViewGlobalSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            condition: ({ user }) => {
              const isAdmin = 'roles' in user && user?.roles?.includes('admin')
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
