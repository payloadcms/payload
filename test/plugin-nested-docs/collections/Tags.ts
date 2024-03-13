// const payload = require('payload');
import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

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
