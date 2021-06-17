import { Field } from '../config/types';

export const baseBlockFields: Field[] = [
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
