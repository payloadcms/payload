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
      admin: {
        description:
          'This is an example of a required point field. Try to submit the form without filling out this field to see the validation error.',
      },
    },
    {
      name: 'locationDisabled',
      type: 'point',
      label: 'Location',
      admin: {
        description: 'This field is disabled because it is readOnly in the admin config.',
        readOnly: true,
      },
      defaultValue: [0, 0],
    },
  ],
}

export default PointFields
