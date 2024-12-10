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
  ],
}

export default DateFields
