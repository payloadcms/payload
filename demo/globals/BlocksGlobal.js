const checkRole = require('../access/checkRole');
const Quote = require('../blocks/Quote');
const CallToAction = require('../blocks/CallToAction');

module.exports = {
  slug: 'blocks-global',
  label: 'Blocks Global',
  access: {
    update: ({ req: { user } }) => checkRole(['admin'], user),
    read: () => true,
  },
  fields: [
    {
      name: 'blocks',
      label: 'Blocks',
      type: 'blocks',
      blocks: [Quote, CallToAction],
      localized: true,
    },
  ],
};
