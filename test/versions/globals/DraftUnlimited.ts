import type { GlobalConfig } from 'payload'

import { draftUnlimitedGlobalSlug } from '../slugs.js'

const DraftUnlimitedGlobal: GlobalConfig = {
  slug: draftUnlimitedGlobalSlug,
  label: 'Draft Unlimited Global',
  admin: {
    preview: () => 'https://payloadcms.com',
    components: {
      views: {
        edit: {
          version: {
            actions: ['/elements/GlobalVersionButton/index.js'],
          },
          versions: {
            actions: ['/elements/GlobalVersionsButton/index.js'],
          },
        },
      },
    },
  },
  versions: {
    max: 0,
    drafts: {
      schedulePublish: true,
    },
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

export default DraftUnlimitedGlobal
