import type { CollectionConfig } from 'payload/types'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'Tag',
    plural: 'Tags',
  },
  admin: {
    useAsTitle: 'tagName',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'tagName',
      label: 'Tag Name',
      type: 'text',
      required: true,
    },
    {
      name: 'uri',
      label: 'Uri',
      type: 'text',
      required: true,
    },
  ],
}
