import ObjectID from 'bson-objectid';
import { Field, FieldHook } from '../config/types.js';

const generateID: FieldHook = ({ value }) => (value || new (ObjectID as any)().toHexString());

export const baseIDField: Field = {
  name: 'id',
  label: 'ID',
  type: 'text',
  hooks: {
    beforeChange: [
      generateID,
    ],
  },
  admin: {
    disabled: true,
  },
};
