import { CollectionConfig } from '../../src/collections/config/types';

const UnstoredMedia: CollectionConfig = {
  slug: 'unstored-media',
  labels: {
    singular: 'Unstored Media',
    plural: 'Unstored Media',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticURL: '/unstored-media',
    disableLocalStorage: true,
    imageSizes: [
      {
        name: 'tablet',
        width: 640,
        height: 480,
        crop: 'left top',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
};

export default UnstoredMedia;
