import type { GlobalConfig } from 'payload'

import { draftGlobalSlug } from '../slugs.js'

const DraftGlobal: GlobalConfig = {
  slug: draftGlobalSlug,
  label: 'Draft Global',
  admin: {
    preview: () => 'https://payloadcms.com',
    components: {
      views: {
        Edit: {
          Version: {
            actions: ['/elements/GlobalVersionButton/index.js'],
          },
          Versions: {
            actions: ['/elements/GlobalVersionsButton/index.js'],
          },
        },
      },
    },
  },
  versions: {
    max: 20,
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return true
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
      }
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
}

export default DraftGlobal
