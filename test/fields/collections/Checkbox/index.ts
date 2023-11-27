import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { checkboxFieldsSlug } from '../../slugs'

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
