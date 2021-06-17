import { v4 as uuidv4 } from 'uuid';
import { Field, FieldHook } from '../config/types';

const uuid: FieldHook = ({ value }) => (value || uuidv4());

export const baseBlockFields: Field[] = [
  {
    name: '_key',
    label: 'Key',
    type: 'text',
    admin: {
      hidden: true,
    },
    hooks: {
      beforeChange: [uuid],
    },
  },
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
