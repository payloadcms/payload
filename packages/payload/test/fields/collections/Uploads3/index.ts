import path from 'path';
import { CollectionConfig } from '../../../../src/collections/config/types';

const Uploads3: CollectionConfig = {
  slug: 'uploads3',
  upload: {
    staticDir: path.resolve(__dirname, './uploads3'),
  },
  labels: {
    singular: 'Upload 3',
    plural: 'Uploads 3',
  },
  admin: {
    enableRichTextRelationship: false,
  },
  fields: [
    {
      type: 'upload',
      name: 'media',
      relationTo: 'uploads3',
    },
    {
      type: 'richText',
      name: 'richText',
    },
  ],
};

export const uploadsDoc = {
  text: 'An upload here',
};

export default Uploads3;
