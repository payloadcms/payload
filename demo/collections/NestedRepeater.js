const NestedRepeater = {
  slug: 'nested-repeaters',
  labels: {
    singular: 'Nested Repeater',
    plural: 'Nested Repeaters',
  },
  policies: {
    read: () => true,
  },
  fields: [
    {
      type: 'repeater',
      label: 'Repeater',
      name: 'repeater',
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
          defaultValue: '',
          type: 'text',
          required: true,
        },
        {
          type: 'repeater',
          name: 'nestedRepeater',
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
              type: 'repeater',
              name: 'deeplyNestedRepeater',
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
                  required: true,
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

module.exports = NestedRepeater;
