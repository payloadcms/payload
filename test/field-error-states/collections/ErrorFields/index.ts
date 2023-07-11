import type { CollectionConfig } from '../../../../src/collections/config/types';
import { Field } from '../../../../src/fields/config/types';

export const errorFieldsSlug = 'error-fields';

const errorFields: Field[] = [
  {
    type: 'text',
    name: 'tabText',
    required: true,
  },
  {
    type: 'collapsible',
    label: 'Collapse me',
    fields: [
      {
        type: 'text',
        name: 'text',
        required: true,
      },
    ],
  },
  {
    type: 'array',
    name: 'array',
    fields: [
      {
        name: 'requiredArrayText',
        type: 'text',
        required: true,
      },
      {
        name: 'arrayText',
        type: 'text',
      },
      {
        type: 'collapsible',
        label: 'Collapse me',
        fields: [
          {
            type: 'group',
            name: 'group',
            fields: [
              {
                type: 'text',
                name: 'text',
                required: true,
              },
              {
                type: 'number',
                name: 'number',
                required: true,
              },
              {
                type: 'date',
                name: 'date',
                required: true,
              },
              {
                type: 'checkbox',
                name: 'checkbox',
                required: true,
                validate: (value) => {
                  if (!value) {
                    return 'This field is required';
                  }
                  return true;
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                type: 'code',
                name: 'code',
                required: true,
              },
              {
                type: 'json',
                name: 'json',
                required: true,
              },
            ],
          },
          {
            type: 'email',
            name: 'email',
            required: true,
          },
          {
            type: 'point',
            name: 'point',
            required: true,
          },
          {
            type: 'radio',
            name: 'radio',
            required: true,
            options: [
              {
                label: 'Mint',
                value: 'mint',
              },
              {
                label: 'Dark Gray',
                value: 'dark_gray',
              },
            ],
          },
          {
            type: 'relationship',
            name: 'relationship',
            relationTo: 'users',
            required: true,
          },
          {
            type: 'richText',
            name: 'richtext',
            required: true,
          },
          {
            type: 'select',
            name: 'select',
            required: true,
            options: [
              {
                label: 'Mint',
                value: 'mint',
              },
              {
                label: 'Dark Gray',
                value: 'dark_gray',
              },
            ],
          },
          {
            type: 'upload',
            name: 'upload',
            required: true,
            relationTo: 'uploads',
          },
          {
            type: 'text',
            name: 'text',
            required: true,
          },
          {
            type: 'textarea',
            name: 'textarea',
            required: true,
          },
        ],
      },
    ],
  },
];

export const ErrorFieldsCollection: CollectionConfig = {
  slug: errorFieldsSlug,
  fields: [
    {
      type: 'array',
      name: 'parentArray',
      fields: [
        {
          type: 'array',
          name: 'childArray',
          required: true,
          minRows: 2,
          fields: [
            {
              type: 'text',
              name: 'childArrayText',
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home',
          name: 'home',
          fields: errorFields,
        },
        {
          label: 'Hero',
          fields: errorFields,
        },
      ],
    },
    {
      type: 'blocks',
      name: 'layout',
      blocks: [
        {
          slug: 'block1',
          fields: errorFields,
        },
      ],
    },
    {
      type: 'group',
      name: 'group',
      label: 'Group Field',
      fields: [
        {
          type: 'text',
          name: 'text',
          required: true,
        },
      ],
    },
  ],
};
