import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

export const GlobalHidden: GlobalConfig = {
  slug: 'hidden-global',
  admin: {
    hidden: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
