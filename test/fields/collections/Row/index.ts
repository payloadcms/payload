import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const rowFieldsSlug = 'row-fields'

const RowFields: CollectionConfig = {
  slug: rowFieldsSlug,
  versions: true,
  admin: {
    defaultColumns: ['title', 'id'],
  },
  fields: [
    {
      name: 'id',
      label: 'Custom ID',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          label: 'Title within a row',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'field_with_width_a',
          label: 'Field with 50% width',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'field_with_width_b',
          label: 'Field with 50% width',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
  ],
}

export default RowFields
