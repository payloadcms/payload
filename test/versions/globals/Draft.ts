import type { GlobalConfig } from 'payload'

import GlobalVersionButton from '../elements/GlobalVersionButton/index.js'
import GlobalVersionsButton from '../elements/GlobalVersionsButton/index.js'
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
            actions: [GlobalVersionButton],
          },
          Versions: {
            actions: [GlobalVersionsButton],
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
