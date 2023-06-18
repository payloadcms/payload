import type { CollectionConfig } from '../../../../src/collections/config/types';

export const defaultNumber = 5;

const NumberFields: CollectionConfig = {
  slug: 'number-fields',
  admin: {
    useAsTitle: 'number',
  },
  fields: [
    {
      name: 'number',
      type: 'number',
    },
    {
      name: 'min',
      type: 'number',
      min: 10,
    },
    {
      name: 'max',
      type: 'number',
      max: 10,
    },
    {
      name: 'positiveNumber',
      type: 'number',
      min: 0,
    },
    {
      name: 'negativeNumber',
      type: 'number',
      max: 0,
    },
    {
      name: 'decimalMin',
      type: 'number',
      min: 0.5,
    },
    {
      name: 'decimalMax',
      type: 'number',
      max: 0.5,
    },
    {
      name: 'defaultNumber',
      type: 'number',
      defaultValue: defaultNumber,
    },
  ],
};

export const numberDoc = {
  number: 5,
  min: 15,
  max: 5,
  positiveNumber: 5,
  negativeNumber: -5,
  decimalMin: 1.25,
  decimalMax: 0.25,
};

export default NumberFields;
