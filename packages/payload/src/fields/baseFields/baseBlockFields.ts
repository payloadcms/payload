import type { Field } from '../config/types'

import { baseIDField } from './baseIDField'

export const baseBlockFields: Field[] = [
  baseIDField,
  {
    name: 'blockName',
    admin: {
      disabled: true,
    },
    label: 'Block Name',
    required: false,
    type: 'text',
  },
]
