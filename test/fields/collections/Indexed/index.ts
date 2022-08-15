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
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          name: 'localizedUnique',
          type: 'text',
          unique: true,
          localized: true,
        },
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Collapsible',
      fields: [
        {
          name: 'collapsibleLocalizedUnique',
          type: 'text',
          unique: true,
          localized: true,
        },
        {
          name: 'collapsibleTextUnique',
          type: 'text',
          label: 'collapsibleTextUnique',
          unique: true,
        },
      ],
    },
  ],
};

export default IndexedFields;
