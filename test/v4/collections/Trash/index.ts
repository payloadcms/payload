import type { CollectionConfig } from 'payload'

import { rubbishSlug } from '../../slugs.js'

const Rubbish: CollectionConfig = {
  slug: rubbishSlug,
  labels: {
    singular: 'Rubbish',
    plural: 'Rubbish',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Trash Enabled',
  },
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default Rubbish
