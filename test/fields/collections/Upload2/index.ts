import path from 'path';
import { CollectionConfig } from '../../../../src/collections/config/types';

const Uploads2: CollectionConfig = {
  slug: 'uploads2',
  upload: {
    staticDir: path.resolve(__dirname, './uploads2'),
  },
  labels: {
    singular: 'Upload 2',
    plural: 'Uploads 2',
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: 'uploads2',
    },
  ],
};

export const uploadsDoc = {
  text: 'An upload here',
};

export default Uploads2;
