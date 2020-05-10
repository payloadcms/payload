const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'footer',
  label: 'Footer',
  policies: {
    update: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'copyright',
      label: 'Copyright',
      type: 'text',
      localized: true,
    },
  ],
};
