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
      'dateWithTimezoneWithDisabledColumns',
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
    {
      name: 'dateWithOffsetTimezone',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      timezone: {
        defaultTimezone: '+05:30',
        supportedTimezones: [
          { label: 'UTC+5:30 (India)', value: '+05:30' },
          { label: 'UTC-8 (PST)', value: '-08:00' },
          { label: 'UTC+0', value: '+00:00' },
        ],
      },
    },
    {
      name: 'dateWithMixedTimezones',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      timezone: {
        defaultTimezone: 'America/New_York',
        supportedTimezones: [
          { label: 'New York', value: 'America/New_York' },
          { label: 'UTC+5:30', value: '+05:30' },
          { label: 'UTC', value: 'UTC' },
        ],
      },
    },
    {
      name: 'dateWithTimezoneWithDisabledColumns',
      type: 'date',
      timezone: {
        override: ({ baseField }) => ({
          ...baseField,
          admin: {
            ...baseField.admin,
            disableListColumn: true,
            description: 'This timezone field was customized via override',
          },
        }),
      },
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}

export default DateFields
