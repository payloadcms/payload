import { Field } from '../fields/config/types.js';

export const getIDType = (idField: Field | null): 'number' | 'text' | 'ObjectID' => {
  if (idField) {
    return idField.type === 'number' ? 'number' : 'text';
  }
  return 'ObjectID';
};
