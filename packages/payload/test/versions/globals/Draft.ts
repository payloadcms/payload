import type { GlobalConfig } from '../../../src/globals/config/types.js';

import { draftGlobalSlug } from '../shared.js';

const DraftGlobal: GlobalConfig = {
  slug: draftGlobalSlug,
  label: 'Draft Global',
  admin: {
    preview: () => 'https://payloadcms.com',
  },
  versions: {
    max: 20,
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return true;
      }

      return {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            _status: {
              exists: false,
            },
          },
        ],
      };
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
