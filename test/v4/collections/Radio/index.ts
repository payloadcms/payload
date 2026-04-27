import type { CollectionConfig } from 'payload'

import { radioFieldsSlug } from '../../slugs.js'

const RadioFields: CollectionConfig = {
  slug: radioFieldsSlug,
  fields: [
    {
      name: 'contentType',
      type: 'radio',
      label: 'Content Type',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    {
      name: 'contentTypeVertical',
      type: 'radio',
      label: 'Content Type',
      admin: {
        layout: 'vertical',
      },
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
  ],
}

export default RadioFields
