import type { Field } from '../config/types.js'

import { nestedIDField } from './baseIDField.js'

export const baseBlockFields: Field[] = [
  nestedIDField,
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
