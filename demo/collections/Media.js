const path = require('path');
const checkRole = require('../access/checkRole');

module.exports = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticURL: '/media',
    staticDir: './media',
    adminThumbnail: 'mobile',
    imageSizes: [
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
      hooks: {
        afterRead: [
          ({ value }) => `${value} alt`,
        ],
      },
    },
    {
      name: 'sizes',
      fields: [
        {
          name: 'icon',
          access: {
            read: ({ req: { user } }) => {
              const result = checkRole(['admin'], user);
              return result;
            },
          },
        },
      ],
    },
  ],
  timestamps: true,
};
