import type { CollectionConfig } from 'payload'

import { checkboxFieldsSlug } from '../../slugs.js'

const CheckboxFields: CollectionConfig = {
  slug: checkboxFieldsSlug,
  fields: [
    {
      name: 'enableFeature',
      type: 'checkbox',
      label: 'Enable Feature',
    },
    {
      name: 'enableFeatureRequired',
      type: 'checkbox',
      label: 'Enable Feature',
      required: true,
    },
    {
      name: 'enableFeatureDisabled',
      type: 'checkbox',
      label: 'Enable Feature',
      defaultValue: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default CheckboxFields
