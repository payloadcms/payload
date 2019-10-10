module.exports = {
  slug: 'footer',
  label: 'Footer',
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
      name: 'copyright',
      label: 'Copyright',
      type: 'input',
      required: true,
    },
  ],
};
