import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { rowFieldsSlug } from '../../slugs'

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
        {
          name: 'disableListColumnText',
          type: 'text',
          admin: {
            disableListColumn: true,
            disableListFilter: false,
          },
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
    {
      type: 'row',
      fields: [
        {
          label: 'Collapsible within a row',
          type: 'collapsible',
          fields: [
            {
              name: 'field_within_collapsible_a',
              label: 'Field within collapsible',
              type: 'text',
            },
          ],
        },
        {
          label: 'Collapsible within a row',
          type: 'collapsible',
          fields: [
            {
              name: 'field_within_collapsible_b',
              label: 'Field within collapsible',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}

export default RowFields
