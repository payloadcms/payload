import type { CollectionConfig } from 'payload'

import { selectFieldsSlug } from '../../slugs.js'
import { CustomJSXLabel } from './CustomJSXLabel.js'

const SelectFields: CollectionConfig = {
  slug: selectFieldsSlug,
  versions: true,
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
      name: 'array',
      type: 'array',
      fields: [
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
          name: 'group',
          type: 'group',
          fields: [
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
    {
      type: 'group',
      name: 'settings',
      fields: [
        {
          name: 'category',
          type: 'select',
          hasMany: true,
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
    },
    {
      name: 'selectWithJsxLabelOption',
      label: 'Select with JSX label option',
      type: 'select',
      defaultValue: 'three',
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
          label: CustomJSXLabel,
          value: 'three',
        },
      ],
    },
    {
      name: 'disallowOption1',
      type: 'checkbox',
    },
    {
      name: 'selectWithFilteredOptions',
      label: 'Select with filtered options',
      type: 'select',
      defaultValue: 'one',
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
      filterOptions: ({ options, data }) =>
        data.disallowOption1
          ? options.filter(
              (option) => (typeof option === 'string' ? options : option.value) !== 'one',
            )
          : options,
    },
    {
      name: 'selectSoft',
      type: 'select',
      soft: true,
      admin: {
        isClearable: true,
      },
      options: [
        {
          label: 'Country One',
          value: 'country-one',
        },
        {
          label: 'Country Two',
          value: 'country-two',
        },
        {
          label: 'Country Three',
          value: 'country-three',
        },
      ],
    },
    {
      name: 'selectSoftHasMany',
      type: 'select',
      soft: true,
      hasMany: true,
      admin: {
        isClearable: true,
        isSortable: true,
      },
      options: [
        {
          label: 'Language One',
          value: 'lang-one',
        },
        {
          label: 'Language Two',
          value: 'lang-two',
        },
        {
          label: 'Language Three',
          value: 'lang-three',
        },
        {
          label: 'Language Four',
          value: 'lang-four',
        },
      ],
    },
  ],
}

export default SelectFields
