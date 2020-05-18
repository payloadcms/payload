const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'global-with-policies',
  label: 'Global with Policies',
  policies: {
    update: ({ req: { user } }) => checkRole(['admin'], user),
    read: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Site Title',
      type: 'text',
      localized: true,
      maxLength: 100,
      required: true,
    },
  ],
};
