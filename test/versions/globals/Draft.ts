import { GlobalConfig } from '../../../src/globals/config/types';

const DraftGlobal: GlobalConfig = {
  slug: 'draft-global',
  label: 'Draft Global',
  preview: () => 'https://payloadcms.com',
  versions: {
    max: 20,
    drafts: true,
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
      access: {
        update: (args) => {
          if (args?.doc?.lockUpdate) {
            return false;
          }
          return true;
        },
      },
    },
    {
      name: 'lockUpdate',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
};

export default DraftGlobal;
