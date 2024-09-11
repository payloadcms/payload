import type { CollectionConfig, Field } from 'payload'

import { arrayFields } from './array'
import { blocksFields } from './blocks'
import { checkboxFields } from './checkbox'
import { dateFields } from './date'
import { emailFields } from './email'
import { numberFields } from './number'
import { pointFields } from './point'
import { radioFields } from './radio'
import { relationshipFields } from './relationship'
import { selectFields } from './select'
import { textFields } from './text'
import { textareaFields } from './textarea'

export const CustomFields: CollectionConfig = {
  slug: 'custom-fields',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    ...([] as Field[]).concat(
      arrayFields,
      blocksFields,
      checkboxFields,
      dateFields,
      emailFields,
      numberFields,
      pointFields,
      radioFields,
      relationshipFields,
      selectFields,
      textFields,
      textareaFields,
    ),
  ],
}
