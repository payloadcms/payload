/* eslint-disable no-console */
import type { CollectionConfig, Field } from 'payload/types'

const urlField: Field = {
  name: 'url',
  type: 'text',
  hooks: {
    afterRead: [
      ({ value }) => {
        console.log('hello from hook')
        return value
      },
    ],
  },
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    imageSizes: [
      {
        height: 400,
        width: 400,
        crop: 'center',
        name: 'square',
      },
      {
        width: 900,
        height: 450,
        crop: 'center',
        name: 'sixteenByNineMedium',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },

    // The following fields should be able to be merged in to default upload fields
    urlField,
    {
      name: 'sizes',
      type: 'group',
      fields: [
        {
          name: 'square',
          type: 'group',
          fields: [urlField],
        },
      ],
    },
  ],
}
