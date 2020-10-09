const Email = require('../blocks/Email');
const Quote = require('../blocks/Quote');
const NumberBlock = require('../blocks/Number');
const CallToAction = require('../blocks/CallToAction');

module.exports = {
  slug: 'blocks',
  labels: {
    singular: 'Blocks',
    plural: 'Blocks',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'layout',
      label: 'Layout Blocks',
      labels: {
        singular: 'Block',
        plural: 'Blocks',
      },
      type: 'blocks',
      blocks: [Email, NumberBlock, Quote, CallToAction],
      localized: true,
      required: true,
    },
    {
      name: 'nonLocalizedLayout',
      label: 'Non Localized Layout',
      labels: {
        singular: 'Layout',
        plural: 'Layouts',
      },
      type: 'blocks',
      blocks: [Email, NumberBlock, Quote, CallToAction],
      required: true,
    },
  ],
};
