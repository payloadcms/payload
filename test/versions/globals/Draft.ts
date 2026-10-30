import type { GlobalConfig } from 'payload'

import { draftGlobalSlug } from '../slugs.js'

const DraftGlobal: GlobalConfig = {
  slug: draftGlobalSlug,
  label: 'Draft Global',
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
    max: 20,
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
    update: ({ req: { context, payload, user } }) => {
      if (context?.denyDraftGlobalUpdate === true) {
        return false
      }

      return Boolean(user) && user?.collection === payload.config.admin.user
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
