import { CollectionConfig, BeforeChangeHook } from '../../src/collections/config/types';

const checkForUploadSizesHook: BeforeChangeHook = ({ req: { payloadUploadSizes }, data }) => {
  if (typeof payloadUploadSizes === 'object') {
    return {
      ...data,
      foundUploadSizes: true,
    };
  }

  return data;
};

const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  access: {
    read: () => true,
  },
  admin: {
    enableRichTextRelationship: true,
    description: 'No selfies please',
  },
  hooks: {
    beforeChange: [
      checkForUploadSizesHook,
    ],
  },
  upload: {
    staticURL: '/media',
    staticDir: './media',
    adminThumbnail: ({ doc }) => `/media/${doc.filename}`,
    imageSizes: [
      {
        name: 'maintainedAspectRatio',
        width: 1024,
        height: null,
        crop: 'center',
      },
      {
        name: 'tablet',
        width: 640,
        height: 480,
        crop: 'left top',
      },
      {
        name: 'mobile',
        width: 320,
        height: 240,
        crop: 'left top',
      },
      {
        name: 'icon',
        width: 16,
        height: 16,
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
    {
      name: 'foundUploadSizes',
      type: 'checkbox',
    },
  ],
  timestamps: true,
};

export default Media;
