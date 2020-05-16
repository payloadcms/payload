const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  useAsTitle: 'filename',
  upload: {
    staticURL: '/media',
    staticDir: 'demo/media',
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
  policies: {
    create: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    read: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    update: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    delete: ({ req: { user } }) => checkRole(['user', 'admin'], user),
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
  timestamps: true,
};
