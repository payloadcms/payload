import type { CollectionConfig } from 'payload'

import { radioFieldsSlug } from '../../slugs.js'
import { CustomJSXLabel } from './CustomJSXLabel.js'

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
    {
      name: 'radioWithJsxLabelOption',
      label: 'Radio with JSX label option',
      type: 'radio',
      defaultValue: 'three',
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: CustomJSXLabel,
          value: 'three',
        },
      ],
    },
  ],
}

export default RadioFields
