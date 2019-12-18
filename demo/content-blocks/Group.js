module.exports = {
  slug: 'group',
  label: 'Group',
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
      name: 'nested',
      label: 'Nested Flexible Block',
      type: 'flexible',
      blocks: ['quote', 'cta'],
      hasMany: true,
    },
    {
      name: 'label',
      label: 'Label',
      type: 'input',
      maxLength: 50,
    }
  ],
  timestamps: true
};
