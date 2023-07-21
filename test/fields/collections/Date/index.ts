import type { CollectionConfig } from '../../../../src/collections/config/types';

export const defaultText = 'default-text';

const DateFields: CollectionConfig = {
  slug: 'date-fields',
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
};

export const dateDoc = {
  default: '2022-08-12T10:00:00.000+00:00',
  timeOnly: '2022-08-12T10:00:00.157+00:00',
  timeOnlyWithCustomFormat: '2022-08-12T10:00:00.157+00:00',
  dayOnly: '2022-08-11T22:00:00.000+00:00',
  dayAndTime: '2022-08-12T10:00:00.052+00:00',
  monthOnly: '2022-07-31T22:00:00.000+00:00',
};

export default DateFields;
