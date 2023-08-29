import { Field } from '../config/types.js';
import { baseIDField } from './baseIDField.js';

export const baseBlockFields: Field[] = [
  baseIDField,
  {
    name: 'blockName',
    label: 'Block Name',
    type: 'text',
    required: false,
    admin: {
      disabled: true,
    },
  },
];
