import type { CollectionConfig } from 'payload'

import { customIDSlug } from '../../slugs.js'

export const CustomID: CollectionConfig = {
  slug: customIDSlug,
  versions: true,
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
    },
  ],
  labels: {
    plural: 'Custom IDs',
    singular: 'Custom ID',
  },
}
