import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { radioFieldsSlug } from '../../collectionSlugs'

const RadioFields: CollectionConfig = {
  slug: radioFieldsSlug,
  fields: [
    {
      name: 'radio',
      label: {
        en: 'Radio en',
        es: 'Radio es',
      },
      type: 'radio',
      options: [
        {
          label: { en: 'Value One', es: 'Value Uno' },
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
      ],
    },
  ],
}

export const radiosDoc = {
  radio: 'one',
}

export default RadioFields
