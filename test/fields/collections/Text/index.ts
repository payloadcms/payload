import type { CollectionConfig } from '../../../../src/collections/config/types';

const TextFields: CollectionConfig = {
  slug: 'text-fields',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
};

export const textDoc = {
  text: 'Seeded text document',
};

export default TextFields;
