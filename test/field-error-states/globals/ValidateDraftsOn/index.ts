import type { GlobalConfig } from 'payload'

import { slugs } from '../../shared.js'

export const GlobalValidateDraftsOn: GlobalConfig = {
  slug: slugs.globalValidateDraftsOn,
  fields: [
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  versions: {
    drafts: {
      validate: true,
      autosave: true,
    },
  },
}
