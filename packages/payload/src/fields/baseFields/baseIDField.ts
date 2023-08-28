import objectIDImp from 'bson-objectid';
// Needed for ESM
const ObjectID = 'default' in objectIDImp ? objectIDImp.default : objectIDImp;
import { Field, FieldHook } from '../config/types.js';

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
