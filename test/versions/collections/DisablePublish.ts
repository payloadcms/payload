import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { disablePublishSlug } from '../slugs.js'

const DisablePublish: CollectionConfig = {
  slug: disablePublishSlug,
  access: {
    create: ({ data }) => {
      return data?._status !== 'published'
    },
    update: ({ data }) => {
      return data?._status !== 'published'
    },
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
}

export default DisablePublish
