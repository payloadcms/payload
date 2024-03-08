import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { disablePublishSlug } from '../slugs.js'

const DisablePublish: CollectionConfig = {
  access: {
    create: ({ data }) => {
      return data._status !== 'published'
    },
    update: ({ data }) => {
      return data._status !== 'published'
    },
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: disablePublishSlug,
  versions: {
    drafts: true,
  },
}

export default DisablePublish
