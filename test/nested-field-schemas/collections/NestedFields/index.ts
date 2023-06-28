import type { CollectionConfig } from '../../../../src/collections/config/types';
import { Field } from '../../../../src/fields/config/types';

export const nestedFieldsSlug = 'posts';

const nestedFields: Field[] = [
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

export const NestedFieldCollection: CollectionConfig = {
  slug: nestedFieldsSlug,
  fields: [
    // {
    //   type: 'array',
    //   name: 'arrayField',
    //   fields: [
    //     {
    //       type: 'group',
    //       name: 'group23field',
    //       fields: [
    //         {
    //           type: 'array',
    //           name: 'arrayField',
    //           required: true,
    //           minRows: 2,
    //           fields: [
    //             {
    //               type: 'group',
    //               name: 'group23field',
    //               fields: [
    //                 {
    //                   type: 'array',
    //                   name: 'arrayField',
    //                   required: true,
    //                   minRows: 2,
    //                   fields: [
    //                     {
    //                       type: 'text',
    //                       name: 'textField',
    //                       required: true,
    //                     },
    //                   ],
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home',
          name: 'home',
          fields: nestedFields,
        },
        {
          label: 'Hero',
          fields: nestedFields,
        },
      ],
    },
    {
      type: 'blocks',
      name: 'layout',
      blocks: [
        {
          slug: 'block1',
          fields: nestedFields,
        },
      ],
    },
  ],
};
