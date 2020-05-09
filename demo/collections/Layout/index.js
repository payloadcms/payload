const checkRole = require('../../policies/checkRole');
const Email = require('../../content-blocks/Email');
const Quote = require('../../content-blocks/Quote');
const NumberBlock = require('../../content-blocks/Number');

module.exports = {
  slug: 'layouts',
  labels: {
    singular: 'Layout',
    plural: 'Layouts',
  },
  useAsTitle: 'title',
  policies: {
    // options: create, read, update, delete
    // null or undefined policies will default to requiring auth
    // any policy can use req.user to see that the user is logged
    create: null,
    read: () => true,
    update: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    delete: ({ req: { user } }) => checkRole(['user', 'admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      unique: true,
      localized: true,
      maxLength: 100,
      required: true,
    },
    {
      name: 'layout',
      label: 'Layout Blocks',
      singularLabel: 'Block',
      type: 'flexible',
      blocks: [Email, NumberBlock, Quote],
      localized: true,
    },
  ],
  timestamps: true,
};
