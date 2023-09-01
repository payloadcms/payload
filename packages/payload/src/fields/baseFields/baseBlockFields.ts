import type { Field } from '../config/types'

import { baseIDField } from './baseIDField'

export const baseBlockFields: Field[] = [
  baseIDField,
  {
    admin: {
      disabled: true,
    },
    label: 'Block Name',
    name: 'blockName',
    required: false,
    type: 'text',
  },
]
