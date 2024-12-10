import type { GlobalConfig } from 'payload'

import { group1GlobalSlug } from '../slugs.js'

export const GlobalGroup1A: GlobalConfig = {
  slug: group1GlobalSlug,
  admin: {
    group: 'Group',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  label: 'Group Globals 1',
}
