import type { CollectionConfig } from 'payload'

import { pointFieldsSlug } from '../../slugs.js'

const PointFields: CollectionConfig = {
  slug: pointFieldsSlug,
  admin: {
    useAsTitle: 'point',
  },
  versions: true,
  fields: [
    {
      name: 'point',
      type: 'point',
      label: 'Location',
      required: true,
    },
    {
      name: 'localized',
      type: 'point',
      label: 'Localized Point',
      unique: true,
      localized: true,
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
  ],
}

export default PointFields
