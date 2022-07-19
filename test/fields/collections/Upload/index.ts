import { CollectionConfig } from '../../../../src/collections/config/types';
import path from 'path';

const Uploads: CollectionConfig = {
  slug: 'uploads',
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
  },
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
