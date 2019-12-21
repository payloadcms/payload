module.exports = {
  slug: 'header',
  label: 'Header',
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
      name: 'title',
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
      required: false,
    },
    {
      name: 'flexibleGlobal',
      label: 'Global Flexible Block',
      type: 'flexible',
      blocks: ['quotes', 'ctas'],
      localized: true,
    },
  ],
};
