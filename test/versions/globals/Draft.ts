import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import GlobalVersionButton from '../elements/GlobalVersionButton'
import GlobalVersionsButton from '../elements/GlobalVersionsButton'
import { draftGlobalSlug } from '../slugs'

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
