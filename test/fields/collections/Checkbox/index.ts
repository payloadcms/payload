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
    {
      name: 'checkboxRequiresTrue',
      type: 'checkbox',
      defaultValue: true,
      // `required` alone won't fail on an unchecked (`false`) checkbox.
      validate: (value) => (value ? true : 'This field is required.'),
    },
  ],
  versions: false,
}

export default CheckboxFields
