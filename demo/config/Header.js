module.exports = {
  slug: 'header',
  labels: {
    singular: 'Header',
  },
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
      name: 'siteTitle',
      label: 'Site Title',
      type: 'input',
      localized: true,
      maxLength: 100,
      required: true,
    },
    {
      name: 'logo',
      label: 'Logo',
      type: 'media',
      required: true
    },
  ],
};
