import type { GlobalConfig } from 'payload'

import { autoSaveGlobalSlug } from '../slugs.js'

const AutosaveGlobal: GlobalConfig = {
  slug: autoSaveGlobalSlug,
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
      localized: true,
      required: true,
    },
  ],
  label: 'Autosave Global',
  versions: {
    drafts: {
      autosave: true,
    },
    max: 20,
  },
}

export default AutosaveGlobal
