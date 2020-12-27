import { Block } from '../../src/fields/config/types';

const NumberBlock: Block = {
  slug: 'number',
  labels: {
    singular: 'Number',
    plural: 'Numbers',
  },
  fields: [
    {
      name: 'testNumber',
      label: 'Test Number Field',
      type: 'number',
      max: 100,
      required: true,
    },
  ],
};

export default NumberBlock;
