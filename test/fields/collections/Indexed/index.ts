import type { CollectionConfig } from 'payload'

import { indexedFieldsSlug } from '../../slugs.js'

const IndexedFields: CollectionConfig = {
  slug: indexedFieldsSlug,
  fields: [
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
      name: 'uniqueRelationship',
      type: 'relationship',
      relationTo: 'text-fields',
      unique: true,
    },
    {
      name: 'uniqueHasManyRelationship',
      type: 'relationship',
      relationTo: 'text-fields',
      unique: true,
      hasMany: true,
    },
    {
      name: 'uniqueHasManyRelationship_2',
      type: 'relationship',
      relationTo: 'text-fields',
      hasMany: true,
      unique: true,
    },
    {
      name: 'uniquePolymorphicRelationship',
      type: 'relationship',
      relationTo: ['text-fields'],
      unique: true,
    },
    {
      name: 'uniquePolymorphicRelationship_2',
      type: 'relationship',
      relationTo: ['text-fields'],
      unique: true,
    },
    {
      name: 'uniqueHasManyPolymorphicRelationship',
      type: 'relationship',
      relationTo: ['text-fields'],
      unique: true,
      hasMany: true,
    },
    {
      name: 'uniqueHasManyPolymorphicRelationship_2',
      type: 'relationship',
      relationTo: ['text-fields'],
      unique: true,
      hasMany: true,
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
    {
      type: 'text',
      name: 'someText',
      index: true,
    },
    {
      type: 'array',
      name: 'some',
      index: true,
      fields: [
        {
          type: 'text',
          name: 'text',
          index: true,
        },
      ],
    },
  ],
  versions: true,
}

export default IndexedFields
