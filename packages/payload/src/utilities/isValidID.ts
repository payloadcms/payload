import objectIDImp from 'bson-objectid';

const ObjectID = 'default' in objectIDImp ? objectIDImp.default : objectIDImp;

export const isValidID = (value: number | string, type: 'ObjectID' | 'number' | 'text'): boolean => {
  if (type === 'ObjectID') {
    return ObjectID.isValid(String(value));
  }
  return (type === 'text' && typeof value === 'string')
    || (type === 'number' && typeof value === 'number' && !Number.isNaN(value));
};
