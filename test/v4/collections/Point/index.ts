import type { CollectionConfig } from 'payload'

import { pointFieldsSlug } from '../../slugs.js'

const PointFields: CollectionConfig = {
  slug: pointFieldsSlug,
  fields: [
    {
      name: 'location',
      type: 'point',
      label: 'Location',
    },
    {
      name: 'locationRequired',
      type: 'point',
      label: 'Location',
      required: true,
    },
    {
      name: 'locationDisabled',
      type: 'point',
      label: 'Location',
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default PointFields
