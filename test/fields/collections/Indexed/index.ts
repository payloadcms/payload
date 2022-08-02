import type { CollectionConfig } from '../../../../src/collections/config/types';

const IndexedFields: CollectionConfig = {
  slug: 'indexed-fields',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'uniqueText',
      type: 'text',
      unique: true,
    },
    {
      name: 'point',
      type: 'point',
    },
  ],
};

export default IndexedFields;
