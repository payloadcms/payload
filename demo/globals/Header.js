const checkRole = require('../policies/checkRole');
const Quote = require('../content-blocks/Quote');
const CallToAction = require('../content-blocks/CallToAction');

module.exports = {
  slug: 'header',
  label: 'Header',
  policies: {
    upsert: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: () => true,
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
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      required: false,
    },
    {
      name: 'flexibleGlobal',
      label: 'Global Flexible Block',
      type: 'flexible',
      blocks: [Quote, CallToAction],
      localized: true,
    },
  ],
};
