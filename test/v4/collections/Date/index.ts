import type { CollectionConfig } from 'payload'

import { dateFieldsSlug } from '../../slugs.js'

const DateFields: CollectionConfig = {
  slug: dateFieldsSlug,
  fields: [
    {
      name: 'default',
      type: 'date',
      label: 'Date',
    },
    {
      name: 'dayOnly',
      type: 'date',
      label: 'Date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'timeOnly',
      type: 'date',
      label: 'Time',
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
        },
      },
    },
    {
      name: 'dayAndTime',
      type: 'date',
      label: 'Date & Time',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}

export default DateFields
