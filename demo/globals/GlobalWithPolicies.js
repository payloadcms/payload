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
      maxLength: 100,
      required: true,
    },
  ],
};
