import type { CollectionConfig } from 'payload'

import { relationsSlug } from '../Relations/index.js'

export const nestedAfterReadHooksSlug = 'nested-after-read-hooks'

export const generatedAfterReadText = 'hello'

const NestedAfterReadHooks: CollectionConfig = {
  slug: nestedAfterReadHooksSlug,
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
              name: 'input',
            },
            {
              type: 'text',
              name: 'afterRead',
              hooks: {
                afterRead: [
                  (): string => {
                    return generatedAfterReadText
                  },
                ],
              },
            },
            {
              name: 'shouldPopulate',
              type: 'relationship',
              relationTo: relationsSlug,
            },
          ],
        },
        {
          type: 'group',
          name: 'subGroup',
          fields: [
            {
              name: 'afterRead',
              type: 'text',
              hooks: {
                afterRead: [
                  (): string => {
                    return generatedAfterReadText
                  },
                ],
              },
            },
            {
              name: 'shouldPopulate',
              type: 'relationship',
              relationTo: relationsSlug,
            },
          ],
        },
      ],
    },
  ],
}

export default NestedAfterReadHooks
