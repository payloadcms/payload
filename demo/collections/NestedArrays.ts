import { CollectionConfig } from '../../src/collections/config/types';

const NestedArray: CollectionConfig = {
  slug: 'nested-arrays',
  labels: {
    singular: 'Nested Array',
    plural: 'Nested Arrays',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'array',
      label: 'Array',
      name: 'array',
      labels: {
        singular: 'Parent Row',
        plural: 'Parent Rows',
      },
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          name: 'parentIdentifier',
          label: 'Parent Identifier',
          defaultValue: ' ',
          type: 'text',
          required: true,
        },
        {
          type: 'array',
          name: 'nestedArray',
          labels: {
            singular: 'Child Row',
            plural: 'Child Rows',
          },
          required: true,
          fields: [
            {
              name: 'childIdentifier',
              label: 'Child Identifier',
              type: 'text',
              required: true,
            },
            {
              type: 'array',
              name: 'deeplyNestedArray',
              labels: {
                singular: 'Grandchild Row',
                plural: 'Grandchild Rows',
              },
              required: true,
              fields: [
                {
                  name: 'grandchildIdentifier',
                  label: 'Grandchild Identifier',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
};

export default NestedArray;
