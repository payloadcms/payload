import type { CollectionConfig, Where } from 'payload'

export const Relationships: CollectionConfig = {
  slug: 'relationships',
  admin: {
    useAsTitle: 'title',
    group: 'Tenant Collections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: 'relationships',
      custom: {
        'plugin-multi-tenant': {
          filterOptionsOverride({ filterOptionsResult }) {
            if (typeof filterOptionsResult === 'object' && filterOptionsResult !== null) {
              // Wrap
              const newResult: Where = {
                or: [
                  filterOptionsResult,
                  {
                    'tenant.isPublic': {
                      equals: true,
                    },
                  },
                ],
              }
              return newResult
            }
            return filterOptionsResult
          },
        },
      },
    },
  ],
}
