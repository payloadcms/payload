import type { BeforeDuplicate, CollectionConfig } from '../../../../src/collections/config/types';
import { IndexedField } from '../../payload-types';

const beforeDuplicate: BeforeDuplicate<IndexedField> = ({ data }) => {
  return {
    ...data,
    uniqueText: data.uniqueText ? `${data.uniqueText}-copy` : '',
    group: {
      ...data.group || {},
      localizedUnique: data.group?.localizedUnique ? `${data.group?.localizedUnique}-copy` : '',
    },
    collapsibleTextUnique: data.collapsibleTextUnique ? `${data.collapsibleTextUnique}-copy` : '',
    collapsibleLocalizedUnique: data.collapsibleLocalizedUnique ? `${data.collapsibleLocalizedUnique}-copy` : '',
  };
};

const IndexedFields: CollectionConfig = {
  slug: 'indexed-fields',
  admin: {
    hooks: {
      beforeDuplicate,
    },
  },
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
