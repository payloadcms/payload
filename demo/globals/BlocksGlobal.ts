import checkRole from '../access/checkRole';
import Quote from '../blocks/Quote';
import CallToAction from '../blocks/CallToAction';
import { GlobalConfig } from '../../src/globals/config/types';

const BlocksGlobal: GlobalConfig = {
  slug: 'blocks-global',
  label: 'Blocks Global',
  versions: {
    max: 20,
    drafts: {
      autosave: true,
    },
  },
  access: {
    update: ({ req: { user } }) => checkRole(['admin'], user),
    read: ({ draft, req: { user } }) => {
      // To read a draft of this global, you need to be authenticated
      if (draft) {
        return Boolean(user);
      }

      return true;
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
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
