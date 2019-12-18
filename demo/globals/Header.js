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
      required: false
    },
    {
      name: 'flexibleGlobal',
      label: 'Global Flexible Block',
      type: 'flexible',
      blocks: ['quote', 'cta'],
      localized: true,
      hasMany: false,
    },
    {
      // TODO: this is some proof of concept parts that are not done.
      // My thinking is that a creator could set up global values that are exposed in the API, but not available to change in the payload UI
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
