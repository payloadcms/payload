import type { CollectionConfig } from 'payload'

import { dateFieldsSlug } from '../../slugs.js'

export const defaultText = 'default-text'

const DateFields: CollectionConfig = {
  slug: dateFieldsSlug,
  admin: {
    useAsTitle: 'default',
  },
  fields: [
    {
      name: 'default',
      type: 'date',
      required: true,
    },
    {
      name: 'timeOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
        },
      },
    },
    {
      name: 'timeOnlyWithCustomFormat',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: 'dayOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'dayAndTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'monthOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'monthOnly',
        },
      },
    },
    {
      name: 'defaultWithTimezone',
      type: 'date',
      timezone: true,
    },
    {
      name: 'dayAndTimeWithTimezone',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'This date here should be required.',
      },
      timezone: true,
    },
    {
      type: 'blocks',
      name: 'timezoneBlocks',
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
      name: 'timezoneArray',
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
