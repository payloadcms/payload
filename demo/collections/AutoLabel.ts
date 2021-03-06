import { PayloadCollectionConfig } from '../../src/collections/config/types';

const AutoLabel: PayloadCollectionConfig = {
  slug: 'auto-label',
  fields: [{
    name: 'autoLabelField',
    type: 'text',
  },
  {
    name: 'noLabel',
    type: 'text',
    label: false,
  },
  {
    name: 'labelOverride',
    type: 'text',
    label: 'Custom Label',
  },
  {
    name: 'specialBlock', // required
    type: 'blocks', // required
    minRows: 1,
    maxRows: 20,
    labels: {
      singular: 'Special Block',
      plural: 'Special Blocks',
    },
    blocks: [ // required
      {
        slug: 'number',
        // Should auto-label
        // labels: {
        //   singular: 'Number',
        //   plural: 'Numbers',
        // },
        fields: [
          {
            name: 'testNumber',
            type: 'number',
          },
        ],
      },
    ],
  },
  ],
};

export default AutoLabel;
