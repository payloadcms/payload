import type { CollectionConfig, Field } from 'payload'

export const errorFieldsSlug = 'error-fields'

const errorFields: Field[] = [
  {
    name: 'tabText',
    type: 'text',
    required: true,
  },
  {
    type: 'collapsible',
    fields: [
      {
        name: 'text',
        type: 'text',
        required: true,
      },
    ],
    label: 'Collapse me',
  },
  {
    name: 'array',
    type: 'array',
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
        fields: [
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'text',
                type: 'text',
                required: true,
              },
              {
                name: 'number',
                type: 'number',
                required: true,
              },
              {
                name: 'date',
                type: 'date',
                required: true,
              },
              {
                name: 'checkbox',
                type: 'checkbox',
                required: true,
                validate: (value) => {
                  if (!value) {
                    return 'This field is required'
                  }
                  return true
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'code',
                type: 'code',
                required: true,
              },
              {
                name: 'json',
                type: 'json',
                required: true,
              },
            ],
          },
          {
            name: 'email',
            type: 'email',
            required: true,
          },
          {
            name: 'point',
            type: 'point',
            required: true,
          },
          {
            name: 'radio',
            type: 'radio',
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
            required: true,
          },
          {
            name: 'relationship',
            type: 'relationship',
            relationTo: 'users',
            required: true,
          },
          {
            name: 'richtext',
            type: 'richText',
            required: true,
          },
          {
            name: 'select',
            type: 'select',
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
            required: true,
          },
          {
            name: 'upload',
            type: 'upload',
            relationTo: 'uploads',
            required: true,
          },
          {
            name: 'text',
            type: 'text',
            required: true,
          },
          {
            name: 'textarea',
            type: 'textarea',
            required: true,
          },
        ],
        label: 'Collapse me',
      },
    ],
  },
]

export const ErrorFieldsCollection: CollectionConfig = {
  slug: errorFieldsSlug,
  fields: [
    {
      name: 'parentArray',
      type: 'array',
      fields: [
        {
          name: 'childArray',
          type: 'array',
          fields: [
            {
              name: 'childArrayText',
              type: 'text',
              required: true,
            },
          ],
          minRows: 2,
          required: true,
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'home',
          fields: errorFields,
          label: 'Home',
        },
        {
          fields: errorFields,
          label: 'Hero',
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: errorFields,
        },
      ],
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
      label: 'Group Field',
    },
  ],
}
