import type { CollectionConfig, Field } from 'payload/types'

import { disabledSlug } from '../../shared.js'

const disabledFromUpdateAccessControl = (fieldName = 'text'): Field => ({
  type: 'text',
  name: fieldName,
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
      type: 'group',
      name: 'group',
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
          label: 'unnamedTab',
          fields: [disabledFromUpdateAccessControl('unnamedTab')],
        },
      ],
    },
    {
      type: 'array',
      name: 'array',
      fields: [disabledFromUpdateAccessControl()],
    },
  ],
}
