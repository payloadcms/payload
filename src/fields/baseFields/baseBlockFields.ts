import { Field } from '../config/types';
import { baseIDField } from './baseIDField';

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
