import type { CollectionConfig } from 'payload/types'

import richText from '../../fields/richText'
import { slugField } from '../../fields/slug'
import populateFullTitle from './hooks/populateFullTitle'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'fullTitle'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'fullTitle',
      type: 'text',
      hooks: {
        beforeChange: [populateFullTitle],
      },
      admin: {
        readOnly: true,
      },
    },
    richText(),
    slugField(),
  ],
}
