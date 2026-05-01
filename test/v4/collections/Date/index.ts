import type { CollectionConfig } from 'payload'

import { dateFieldsSlug } from '../../slugs.js'

const DateFields: CollectionConfig = {
  slug: dateFieldsSlug,
  fields: [
    {
      name: 'default',
      type: 'date',
    },
    {
      name: 'required',
      type: 'date',
      required: true,
      admin: {
        description: 'Select a date from the calendar',
      },
    },
    {
      name: 'disabled',
      type: 'date',
      admin: {
        disabled: true,
      },
      defaultValue: '2026-01-15T12:00:00.000Z',
    },
    {
      name: 'readOnly',
      type: 'date',
      admin: {
        readOnly: true,
      },
      defaultValue: '2026-01-15T12:00:00.000Z',
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
      name: 'timeOnly',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
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
  ],
}

export default DateFields
