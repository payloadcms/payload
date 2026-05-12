import type { CollectionConfig } from 'payload'

import { hierarchySlug } from '../../slugs.js'

const Hierarchy: CollectionConfig = {
  slug: hierarchySlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
  },
}

export default Hierarchy
