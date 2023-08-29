import type { Field } from '../config/types.js';

import { baseIDField } from './baseIDField.js';

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
];
