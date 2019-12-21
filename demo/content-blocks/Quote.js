module.exports = {
  slug: 'quotes',
  labels: {
    singular: 'Quote',
    plural: 'Quotes',
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
      name: 'author',
      label: 'Author',
      type: 'input',
      maxLength: 100,
      required: true,
    },
    {
      name: 'quote',
      label: 'Quote',
      type: 'textarea',
      height: 100,
      required: true,
    },
    {
      name: 'color',
      label: 'Color',
      type: 'input',
      maxLength: 7,
      required: true,
    },
  ],
};
