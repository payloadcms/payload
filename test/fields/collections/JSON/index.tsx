import type { CollectionConfig } from '../../../../src/collections/config/types';


type JSONField = {
  id: string;
  json?: any;
  createdAt: string;
  updatedAt: string;
}

const JSON: CollectionConfig = {
  slug: 'json-fields',
  versions: {
    maxPerDoc: 1,
  },
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
};

export const jsonDoc: Partial<JSONField> = {
  json: {
    property: 'value',
    arr: [
      'val1',
      'val2',
      'val3',
    ],
    nested: {
      value: 'nested value',
    },
  },
};

export default JSON;
