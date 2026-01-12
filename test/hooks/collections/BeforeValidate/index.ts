import type { CollectionConfig } from 'payload'

import { beforeValidateSlug } from '../../shared.js'

export const BeforeValidateCollection: CollectionConfig = {
  slug: beforeValidateSlug,
  fields: [
    {
      type: 'text',
      name: 'title',
      hooks: {
        beforeValidate: [
          () => {
            return 'reset in beforeValidate'
          },
        ],
      },
    },
    {
      type: 'select',
      name: 'selection',
      options: [
        {
          label: 'A',
          value: 'a',
        },
        {
          label: 'B',
          value: 'b',
        },
      ],
      hooks: {
        beforeValidate: [
          ({ value, previousValue, context }) => {
            if (context.beforeValidateTest) {
              if (value !== 'a') {
                return 'beforeValidate value is incorrect'
              }

              if (previousValue !== 'b') {
                return 'beforeValidate previousValue is incorrect'
              }

              return value
            }
          },
        ],
      },
    },
  ],
}
