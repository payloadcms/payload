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
