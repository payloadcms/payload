import { GlobalConfig } from '../../../src/globals/config/types';
import { draftGlobalSlug } from '../shared';

const DraftGlobal: GlobalConfig = {
  slug: draftGlobalSlug,
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
    },
  ],
};

export default DraftGlobal;
