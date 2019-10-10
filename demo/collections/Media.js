module.exports = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  useAsTitle: 'name',
  policies: {
    create: (req, res, next) => {
      return next();
    },
    read: (req, res, next) => {
      return next();
    },
    update: (req, res, next) => {
      return next();
    },
    destroy: (req, res, next) => {
      return next();
    },
  },
  media: {
    staticUrl: '/media',
    staticDir: 'demo/media',
    type: 'image',
    accept: ['.jpg', '.jpeg', '.png'],
    imageSizes: [
      {
        name: 'tablet',
        width: 640,
        height: 480,
        crop: 'left top' // would it make sense for this to be set by the uploader?
      },
      {
        name: 'mobile',
        width: 320,
        height: 240,
        crop: 'left top'
      },
      { // Is the icon size required for the admin dashboard to work?
        name: 'icon',
        width: 16,
        height: 16
      }
    ],
  },
  fields: [
    // users could have fields if they want, not required
  ],
  timestamps: true
};
