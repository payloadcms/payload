import type { CollectionConfig } from 'payload/types'

import { indexedFieldsSlug } from '../../slugs.js'

const IndexedFields: CollectionConfig = {
  slug: indexedFieldsSlug,
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
    },
    {
      name: 'text',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'uniqueText',
      type: 'text',
      unique: true,
    },
    {
      name: 'uniqueRequiredText',
      type: 'text',
      defaultValue: 'uniqueRequired',
      required: true,
      unique: true,
    },
    {
      name: 'localizedUniqueRequiredText',
      type: 'text',
      defaultValue: 'localizedUniqueRequired',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'point',
      type: 'point',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'localizedUnique',
          type: 'text',
          localized: true,
          unique: true,
        },
        {
          name: 'unique',
          type: 'text',
          unique: true,
        },
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
    {
      type: 'collapsible',
      fields: [
        {
          name: 'collapsibleLocalizedUnique',
          type: 'text',
          localized: true,
          unique: true,
        },
        {
          name: 'collapsibleTextUnique',
          type: 'text',
          label: 'collapsibleTextUnique',
          unique: true,
        },
      ],
      label: 'Collapsible',
    },
  ],
  versions: true,
}

export default IndexedFields
