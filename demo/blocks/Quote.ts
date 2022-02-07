import { Block } from '../../src/fields/config/types';

const Quote: Block = {
  imageURL: '/static/assets/images/generic-block-image.svg',
  slug: 'quote',
  labels: {
    singular: 'Quote',
    plural: 'Quotes',
  },
  fields: [
    {
      name: 'quote',
      label: 'Quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'color',
      label: 'Color',
      type: 'text',
      maxLength: 7,
      required: true,
    },
  ],
};

export default Quote;
