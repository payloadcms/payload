import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { autoSaveGlobalSlug } from '../slugs'

const AutosaveGlobal: GlobalConfig = {
  slug: autoSaveGlobalSlug,
  label: 'Autosave Global',
  admin: {
    preview: () => 'https://payloadcms.com',
  },
  versions: {
    max: 20,
    drafts: {
      autosave: true,
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

export default AutosaveGlobal
