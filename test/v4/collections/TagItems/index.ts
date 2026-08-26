import type { CollectionConfig } from 'payload'

import { createTagField } from 'payload'

import { tagItemsSlug, tagsSlug } from '../../slugs.js'

const TagItems: CollectionConfig = {
  slug: tagItemsSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Hierarchy Collections',
  },
  labels: {
    plural: 'Tag Items',
    singular: 'Tag Item',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    createTagField({ relationTo: tagsSlug }),
  ],
  versions: false,
}

export default TagItems
