module.exports = {
  slug: 'ctas',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  useAsContentBlock: true,
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
      name: 'label',
      label: 'Label',
      type: 'input',
      maxLength: 100,
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'input',
      height: 100,
      required: true,
    },
  ],
  timestamps: true,
};
