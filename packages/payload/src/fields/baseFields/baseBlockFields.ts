import type { FieldWithRichTextRequiredEditor } from '../config/types.js'

import { baseIDField } from './baseIDField.js'

export const baseBlockFields: FieldWithRichTextRequiredEditor[] = [
  baseIDField,
  {
    name: 'blockName',
    type: 'text',
    admin: {
      disabled: true,
    },
    label: 'Block Name',
    required: false,
  },
]
