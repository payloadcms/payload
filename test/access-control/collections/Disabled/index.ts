import type { CollectionConfig, Field } from 'payload'

import { disabledSlug } from '../../shared.js'

const disabledFromUpdateAccessControl = (fieldName = 'text'): Field => ({
  name: fieldName,
  type: 'text',
  access: {
    update: () => {
      return false
    },
  },
})

export const Disabled: CollectionConfig = {
  slug: disabledSlug,
  fields: [
    {
      name: 'group',
      type: 'group',
      fields: [disabledFromUpdateAccessControl()],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'namedTab',
          fields: [disabledFromUpdateAccessControl()],
        },
        {
          fields: [disabledFromUpdateAccessControl('unnamedTab')],
          label: 'unnamedTab',
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      fields: [disabledFromUpdateAccessControl()],
    },
  ],
}
