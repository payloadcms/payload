import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

const CheckboxFields: CollectionConfig = {
  slug: 'checkbox-fields',
  fields: [
    {
      name: 'checkbox',
      type: 'checkbox',
      required: true,
    },
  ],
}

export default CheckboxFields
