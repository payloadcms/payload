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
      required: true
    },
    {
      name: 'settings',
      type: 'json',
      value: {
        property1: process.env.production || false,
        property2: 'some string',
        property3: () => {
          console.log('Header.settings.property3 called');
          return 1 + 1;
        }
      }
    }
  ],
};
