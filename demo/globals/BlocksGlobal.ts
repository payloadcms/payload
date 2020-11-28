import checkRole from '../access/checkRole';
import Quote from '../blocks/Quote';
import CallToAction from '../blocks/CallToAction';

export default {
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
