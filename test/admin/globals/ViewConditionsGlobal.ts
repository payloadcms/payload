import type { GlobalConfig } from 'payload'

import { viewConditionsGlobalSlug } from '../slugs.js'

export const ViewConditionsGlobal: GlobalConfig = {
  slug: viewConditionsGlobalSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            condition: ({ req: { user } }) => {
              const isAdmin = user && 'roles' in user && user?.roles?.includes('admin')
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
