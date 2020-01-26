const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'footer',
  label: 'Footer',
  policies: {
    create: user => checkRole(['admin'], user),
    read: () => true,
    update: user => checkRole(['admin'], user),
    destroy: user => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'copyright',
      label: 'Copyright',
      type: 'text',
    },
  ],
};
