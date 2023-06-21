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
            type: 'text',
            name: 'text',
            required: true,
          },
        ],
      },
    ],
  },
  {
    type: 'blocks',
    name: 'layout',
    blocks: [
      {
        slug: 'block1',
        fields: [
          {
            type: 'text',
            name: 'blockText',
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
    {
      type: 'array',
      name: 'arrayField',
      fields: [
        {
          type: 'group',
          name: 'group23field',
          fields: [
            {
              type: 'array',
              name: 'arrayField',
              required: true,
              minRows: 2,
              fields: [
                {
                  type: 'group',
                  name: 'group23field',
                  fields: [
                    {
                      type: 'array',
                      name: 'arrayField',
                      required: true,
                      minRows: 2,
                      fields: [
                        {
                          type: 'text',
                          name: 'textField',
                          required: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    // {
    //   type: 'tabs',
    //   tabs: [
    //     {
    //       label: 'Home',
    //       name: 'home',
    //       fields: nestedFields,
    //     },
    //     {
    //       label: 'Hero',
    //       fields: nestedFields,
    //     },
    //   ],
    // },
  ],
};
