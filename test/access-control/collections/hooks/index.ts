import type { CollectionConfig } from 'payload'

import { hooksSlug } from '../../shared.js'

export const Hooks: CollectionConfig = {
  slug: hooksSlug,
  access: {
    update: () => true,
  },
  fields: [
    {
      name: 'cannotMutateRequired',
      type: 'text',
      access: {
        update: () => false,
      },
      required: true,
    },
    {
      name: 'cannotMutateNotRequired',
      type: 'text',
      access: {
        update: () => false,
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value) {
              return 'no value found'
            }
            return value
          },
        ],
      },
    },
    {
      name: 'canMutate',
      type: 'text',
      access: {
        update: () => true,
      },
    },
  ],
}
