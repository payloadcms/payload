import checkRole from '../access/checkRole';
import Quote from '../blocks/Quote';
import CallToAction from '../blocks/CallToAction';
import { GlobalConfig } from '../../src/globals/config/types';

const BlocksGlobal: GlobalConfig = {
  slug: 'blocks-global',
  label: 'Blocks Global',
  versions: {
    max: 20,
  },
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

export default BlocksGlobal;
