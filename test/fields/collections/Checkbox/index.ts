import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

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
