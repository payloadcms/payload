import { v4 as uuidv4 } from 'uuid';
import { Block, FieldHook } from '../config/types';

const uuid: FieldHook = ({ value }) => (value || uuidv4());

export default {
  fields: [
    {
      name: '_key',
      label: 'Key',
      type: 'text',
      unique: true,
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [uuid],
      },
    },
    {
      name: 'blockName',
      label: 'BlockName',
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
  ],
} as Partial<Block>;
