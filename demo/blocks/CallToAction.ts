import { Block } from '../../src/fields/config/types';

const CTA: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      maxLength: 100,
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      required: true,
    },
  ],
};

export default CTA;
