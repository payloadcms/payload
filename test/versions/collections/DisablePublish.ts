import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

const DisablePublish: CollectionConfig = {
  slug: 'disable-publish',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: ({ data }) => {
      return data._status !== 'published'
    },
    update: ({ data }) => {
      return data._status !== 'published'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default DisablePublish
