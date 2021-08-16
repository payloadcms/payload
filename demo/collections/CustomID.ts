import { CollectionConfig } from '../../src/collections/config/types';

const CustomID: CollectionConfig = {
  slug: 'custom-id',
  labels: {
    singular: 'CustomID',
    plural: 'CustomIDs',
  },
  id: Number,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
};

export default CustomID;
