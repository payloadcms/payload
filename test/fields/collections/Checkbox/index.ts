import type { CollectionConfig } from 'payload'

import { checkboxFieldsSlug } from '../../slugs.js'

const CheckboxFields: CollectionConfig = {
  slug: checkboxFieldsSlug,
  fields: [
    {
      name: 'checkbox',
      type: 'checkbox',
      required: true,
    },
  ],
}

export default CheckboxFields
