import { CollectionConfig } from '../../src/collections/config/types';

const Images: CollectionConfig = {
  slug: 'images',
  labels: {
    singular: 'Image',
    plural: 'Images',
  },
  fields: [
    {
      name: 'upload1',
      label: 'Upload 1',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'upload2',
      label: 'Upload 2',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
};

export default Images;
