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
    {
      name: 'checkboxNotRequired',
      type: 'checkbox',
    },
  ],
}

export default CheckboxFields
