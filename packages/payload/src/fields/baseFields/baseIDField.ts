import ObjectID from 'bson-objectid';
import { Field, FieldHook } from '../config/types';

const generateID: FieldHook = ({ value }) => (value || new ObjectID().toHexString());

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
