const checkRole = require('../policies/checkRole');
const Quote = require('../content-blocks/Quote');
const CallToAction = require('../content-blocks/CallToAction');

module.exports = {
  slug: 'flexible-global',
  label: 'Flexible Global',
  policies: {
    update: ({ req: { user } }) => checkRole(['admin'], user),
    read: () => true,
  },
  fields: [
    {
      name: 'flexibleGlobal',
      label: 'Global Flexible Block',
      type: 'flexible',
      blocks: [Quote, CallToAction],
      localized: true,
    },
  ],
};
