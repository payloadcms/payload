import { CollectionConfig } from '../../../../src/collections/config/types';

const Uploads: CollectionConfig = {
  slug: 'uploads',
  upload: true,
  fields: [
    {
      type: 'text',
      name: 'text',
    },
  ],
};

export const uploadsDoc = {
  text: 'An upload here',
};

export default Uploads;
