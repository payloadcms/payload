module.exports = {
  slug: 'cta',
  label: 'CTA',
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
      required: true
    },
    {
      name: 'url',
      label: 'URL',
      type: 'input',
      height: 100,
      required: true
    },
  ],
  timestamps: true
};
