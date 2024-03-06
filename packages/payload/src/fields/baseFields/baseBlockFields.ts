import type { Field } from '../config/types.d.ts'

import { baseIDField } from './baseIDField.js'

export const baseBlockFields: Field[] = [
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
