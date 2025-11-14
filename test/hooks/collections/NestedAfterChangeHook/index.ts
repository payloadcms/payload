import type { CollectionConfig } from 'payload'
export const nestedAfterChangeHooksSlug = 'nested-after-change-hooks'

const NestedAfterChangeHooks: CollectionConfig = {
  slug: nestedAfterChangeHooksSlug,
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              type: 'text',
              name: 'nestedAfterChange',
              hooks: {
                afterChange: [
                  ({ previousValue, operation }) => {
                    console.log(previousValue)
                    if (operation === 'update' && typeof previousValue === 'undefined') {
                      throw new Error('previousValue is missing in nested beforeChange hook')
                    }
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
}

export default NestedAfterChangeHooks
