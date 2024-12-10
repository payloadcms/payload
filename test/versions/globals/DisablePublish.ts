import type { GlobalConfig } from 'payload'

import { disablePublishGlobalSlug } from '../slugs.js'

const DisablePublishGlobal: GlobalConfig = {
  slug: disablePublishGlobalSlug,
  access: {
    update: ({ data }) => {
      return data?._status !== 'published'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}

export default DisablePublishGlobal
