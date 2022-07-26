import type { CollectionConfig } from '../../../../src/collections/config/types';

const DateField: CollectionConfig = {
  slug: 'date-field',
  fields: [
    {
      name: 'date',
      type: 'date',
    },
  ],
};

export default DateField;
