import type { CollectionConfig } from 'payload'

import { dateFieldsWithTimezoneSlug } from '../../slugs.js'

export const defaultText = 'default-text'

const DateFields: CollectionConfig = {
  slug: dateFieldsWithTimezoneSlug,
  admin: {
    useAsTitle: 'default',
  },
  fields: [
    {
      name: 'default',
      type: 'date',
      required: true,
      timezone: true,
    },
    {
      name: 'dayAndTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      timezone: true,
    },
    {
      type: 'blocks',
      name: 'blocks',
      blocks: [
        {
          slug: 'dateBlock',
          fields: [
            {
              name: 'dayAndTime',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
              timezone: true,
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'array',
      fields: [
        {
          name: 'dayAndTime',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
          timezone: true,
        },
      ],
    },
  ],
}

export default DateFields
