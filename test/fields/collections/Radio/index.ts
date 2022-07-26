import type { CollectionConfig } from '../../../../src/collections/config/types';

const RadioFields: CollectionConfig = {
  slug: 'radio-fields',
  fields: [
    {
      name: 'radio',
      type: 'radio',
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
      ],
    },
  ],
};

export default RadioFields;
