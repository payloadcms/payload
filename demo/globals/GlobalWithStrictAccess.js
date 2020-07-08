const checkRole = require('../access/checkRole');

module.exports = {
  slug: 'global-with-access',
  label: 'Global with Strict Access',
  access: {
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
