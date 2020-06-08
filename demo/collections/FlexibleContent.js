const Email = require('../content-blocks/Email');
const Quote = require('../content-blocks/Quote');
const NumberBlock = require('../content-blocks/Number');

module.exports = {
  slug: 'flexible-content',
  labels: {
    singular: 'Flexible Content',
    plural: 'Flexible Content',
  },
  fields: [
    {
      name: 'layout',
      label: 'Layout Blocks',
      singularLabel: 'Block',
      type: 'flexible',
      blocks: [Email, NumberBlock, Quote],
      localized: true,
      required: true,
    },
  ],
  timestamps: true,
};
