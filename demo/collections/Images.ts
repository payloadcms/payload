import { CollectionConfig } from '../../src/collections/config/types';

const Images: CollectionConfig = {
  slug: 'images',
  admin: {
    description: 'Used to test upload relationship queries',
  },
  labels: {
    singular: 'Image',
    plural: 'Images',
  },
  fields: [
    {
      name: 'upload',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
};

export default Images;
