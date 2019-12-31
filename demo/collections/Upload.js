module.exports = {
  slug: 'uploads',
  labels: {
    singular: 'Upload',
    plural: 'Uploads',
  },
  useAsTitle: 'filename',
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
  fields: [
    {
      name: 'test-custom-media-field',
      label: 'Testing a Custom Media Field',
      type: 'input',
      maxLength: 100,
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
