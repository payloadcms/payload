import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { group1GlobalSlug } from '../slugs'

export const GlobalGroup1A: GlobalConfig = {
  slug: group1GlobalSlug,
  label: 'Group Globals 1',
  admin: {
    group: 'Group',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
