import type { CollectionConfig } from 'payload'

import { placeholderCollectionSlug } from '../slugs.js'

export const Placeholder: CollectionConfig = {
  slug: placeholderCollectionSlug,
  fields: [
    {
      name: 'defaultSelect',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
      ],
    },
    {
      name: 'placeholderSelect',
      type: 'select',
      options: [{ label: 'Option 1', value: 'option1' }],
      admin: {
        placeholder: 'Custom placeholder',
      },
    },
    {
      name: 'defaultRelationship',
      type: 'relationship',
      relationTo: 'posts',
    },
    {
      name: 'placeholderRelationship',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        placeholder: 'Custom placeholder',
      },
    },
  ],
  versions: true,
}
