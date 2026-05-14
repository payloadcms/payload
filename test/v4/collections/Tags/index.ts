import type { CollectionConfig } from 'payload'

import { tagsSlug } from '../../slugs.js'

const Tags: CollectionConfig = {
  slug: tagsSlug,
  admin: {
    useAsTitle: 'name',
  },
  labels: {
    plural: 'Tags',
    singular: 'Tag',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
  },
}

export default Tags
