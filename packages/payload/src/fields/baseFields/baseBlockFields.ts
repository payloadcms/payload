import type { Field } from '../config/types.js'

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
