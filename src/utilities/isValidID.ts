import ObjectID from 'bson-objectid';

export const isValidID = (value: string | number, type: 'text' | 'number' | 'ObjectID'): boolean => {
  if (type === 'ObjectID') {
    return ObjectID.isValid(String(value));
  }
  return (type === 'text' && typeof value === 'string')
    || (type === 'number' && typeof value === 'number' && !Number.isNaN(value));
};
