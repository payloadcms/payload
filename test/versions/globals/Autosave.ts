import { GlobalConfig } from '../../../src/globals/config/types';

const AutosaveGlobal: GlobalConfig = {
  slug: 'autosave-global',
  label: 'Autosave Global',
  versions: {
    max: 20,
    drafts: {
      autosave: true,
    },
  },
  access: {
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
  ],
};

export default AutosaveGlobal;
