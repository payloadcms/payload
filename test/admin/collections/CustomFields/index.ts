import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customTextServerField',
      type: 'text',
      maxLength: 100,
      admin: {
        placeholder: 'This is a placeholder',
      },
      minLength: 3,
    },
    {
      name: 'customTextClientField',
      type: 'text',
      maxLength: 100,
      admin: {
        placeholder: 'This is a placeholder',
      },
      minLength: 3,
    },
    {
      name: 'descriptionAsString',
      type: 'text',
      admin: {
        description: 'Static field description.',
      },
    },
    {
      name: 'descriptionAsFunction',
      type: 'text',
      admin: {
        description: () => 'Function description',
      },
    },
    {
      name: 'descriptionAsComponent',
      type: 'text',
    },
    {
      name: 'customSelectField',
      type: 'text',
    },
    {
      name: 'customSelectInput',
      type: 'text',
    },
    {
      name: 'customMultiSelectField',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'relationshipFieldWithBeforeAfterInputs',
      type: 'relationship',
      relationTo: 'posts',
    },
    {
      name: 'arrayFieldWithBeforeAfterInputs',
      type: 'array',
      fields: [
        {
          name: 'someTextField',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocksFieldWithBeforeAfterInputs',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockFields',
          fields: [
            {
              name: 'textField',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      label: 'Collapsible Field With Before & After Inputs',
      type: 'collapsible',
      admin: {
        description: 'This is a collapsible field.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'groupFieldWithBeforeAfterInputs',
      type: 'group',
      fields: [
        {
          name: 'textOne',
          type: 'text',
        },
        {
          name: 'textTwo',
          type: 'text',
        },
      ],
    },
    {
      name: 'radioFieldWithBeforeAfterInputs',
      label: {
        en: 'Radio en',
        es: 'Radio es',
      },
      type: 'radio',
      options: [
        {
          label: { en: 'Value One', es: 'Value Uno' },
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
      name: 'allButtons',
      type: 'ui',
    },
  ],
}
