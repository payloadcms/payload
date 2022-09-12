import type { CollectionConfig } from '../../../../src/collections/config/types';

const SelectFields: CollectionConfig = {
  slug: 'select-fields',
  fields: [
    {
      name: 'select',
      type: 'select',
      admin: {
        isClearable: true,
      },
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
      ],
    },
    {
      name: 'selectHasMany',
      hasMany: true,
      type: 'select',
      admin: {
        isClearable: true,
        isSortable: true,
      },
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
        {
          label: 'Value Four',
          value: 'four',
        },
        {
          label: 'Value Five',
          value: 'five',
        },
        {
          label: 'Value Six',
          value: 'six',
        },
      ],
    },
  ],
};

export const selectsDoc = {
  select: 'one',
  selectHasMany: ['two', 'four'],
};

export default SelectFields;
