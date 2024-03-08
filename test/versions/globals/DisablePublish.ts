import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types.js'

import { disablePublishGlobalSlug } from '../slugs.js'

const DisablePublishGlobal: GlobalConfig = {
  access: {
    update: ({ data }) => {
      return data._status !== 'published'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  slug: disablePublishGlobalSlug,
  versions: {
    drafts: true,
  },
}

export default DisablePublishGlobal
