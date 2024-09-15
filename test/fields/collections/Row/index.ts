import type { CollectionConfig } from 'payload'

import { rowFieldsSlug } from '../../slugs.js'

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
    {
      type: 'row',
      fields: [
        {
          name: 'field_with_width_30_percent',
          label: 'Field with 30% width',
          type: 'text',
          admin: {
            width: '30%',
          },
        },
        {
          name: 'field_with_width_60_percent',
          label: 'Field with 60% width',
          type: 'text',
          admin: {
            width: '60%',
          },
        },
        {
          name: 'field_with_width_20_percent',
          label: 'Field with 20% width',
          type: 'text',
          admin: {
            width: '20%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          label: 'Collapsible 30% width within a row',
          type: 'collapsible',
          fields: [
            {
              name: 'field_within_collapsible_a',
              label: 'Field within collapsible',
              type: 'text',
            },
          ],
          admin: {
            width: '30%',
          },
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
    {
      type: 'row',
      fields: [
        {
          label: 'Explicit 20% width within a row (A)',
          type: 'text',
          name: 'field_20_percent_width_within_row_a',
          admin: {
            width: '20%',
          },
        },
        {
          label: 'No set width within a row (B)',
          type: 'text',
          name: 'no_set_width_within_row_b',
        },
        {
          label: 'No set width within a row (C)',
          type: 'text',
          name: 'no_set_width_within_row_c',
        },
        {
          label: 'Explicit 20% width within a row (D)',
          type: 'text',
          name: 'field_20_percent_width_within_row_d',
          admin: {
            width: '20%',
          },
        },
      ],
    },
  ],
}

export default RowFields
