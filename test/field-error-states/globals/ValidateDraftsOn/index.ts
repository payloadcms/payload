import type { GlobalConfig } from 'payload'

import { globalSlugs } from '../../shared.js'

export const GlobalValidateDraftsOn: GlobalConfig = {
  slug: globalSlugs.globalValidateDraftsOn,
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
      autosave: true,
      validate: true,
    },
  },
}
