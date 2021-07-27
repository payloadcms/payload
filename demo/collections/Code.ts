import { PayloadCollectionConfig } from '../../src/collections/config/types';

const Code: PayloadCollectionConfig = {
  slug: 'code',
  labels: {
    singular: 'Code',
    plural: 'Codes',
  },
  fields: [
    {
      name: 'code',
      type: 'code',
      label: 'Code',
      required: true,
      admin: {
        language: 'js',
        description: 'javascript example',
      },
    },
  ],
};

export default Code;
