import type { CollectionConfig } from 'payload'

import { orderableSlug } from '../../slugs.js'

const Orderable: CollectionConfig = {
  slug: orderableSlug,
  admin: {
    useAsTitle: 'title',
  },
  orderable: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  ],
}

export default Orderable
