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
    create: null,
    read: ({ req: { user } }) => checkRole(['admin'], user),
    update: ({ req: { user } }) => checkRole(['admin'], user),
    delete: ({ req: { user } }) => checkRole(['admin'], user),
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
