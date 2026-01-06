import type { CollectionConfig } from 'payload'

import { dateFieldsSlug } from '../../slugs.js'

export const defaultText = 'default-text'

const DateFields: CollectionConfig = {
  slug: dateFieldsSlug,
  admin: {
    useAsTitle: 'default',
    defaultColumns: [
      'default',
      'timeOnly',
      'dayAndTimeWithTimezone',
      'timezoneGroup.dayAndTime',
      'dayAndTimeWithTimezoneFixed',
    ],
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
      name: 'timeOnlyWithMiliseconds',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
          displayFormat: 'h:mm.ss.SSS aa',
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
      name: 'dayAndTimeWithTimezoneFixed',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      timezone: {
        defaultTimezone: 'Europe/London',
        supportedTimezones: [{ label: 'London', value: 'Europe/London' }],
      },
    },
    {
      name: 'dayAndTimeWithTimezoneRequired',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      timezone: {
        defaultTimezone: 'America/New_York',
        required: true,
      },
    },
    {
      name: 'dayAndTimeWithTimezoneReadOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
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
    {
      type: 'group',
      name: 'timezoneGroup',
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
    {
      type: 'array',
      name: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
        },
      ],
    },
  ],
}

export default DateFields
