import { PayloadCollectionConfig } from '../../src/collections/config/types';

const Uniques: PayloadCollectionConfig = {
  slug: 'uniques',
  labels: {
    singular: 'Unique',
    plural: 'Uniques',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
  ],
};

export default Uniques;
