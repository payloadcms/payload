import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

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
      name: 'selectReadOnly',
      type: 'select',
      admin: {
        readOnly: true,
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
    {
      name: 'selectHasManyLocalized',
      type: 'select',
      hasMany: true,
      localized: true,
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
      ],
    },
    {
      name: 'selectI18n',
      type: 'select',
      admin: {
        isClearable: true,
      },
      options: [
        {
          value: 'one',
          label: { en: 'One', es: 'Uno' },
        },
        {
          value: 'two',
          label: { en: 'Two', es: 'Dos' },
        },
        {
          value: 'three',
          label: { en: 'Three', es: 'Tres' },
        },
      ],
    },
    {
      name: 'simple',
      type: 'select',
      options: ['One', 'Two', 'Three'],
    },
  ],
}

export const selectsDoc = {
  select: 'one',
  selectHasMany: ['two', 'four'],
}

export default SelectFields
