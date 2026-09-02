import type { GlobalConfig } from 'payload'

import { selectOptionsGlobalSlug } from '../slugs.js'

export const SelectOptions: GlobalConfig = {
  slug: selectOptionsGlobalSlug,
  fields: [
    {
      name: 'options',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  versions: false,
}
