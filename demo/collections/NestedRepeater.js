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
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          name: 'parentIdentifier',
          label: 'Parent Identifier',
          type: 'text',
          required: true,
        },
        {
          type: 'repeater',
          name: 'nestedRepeater',
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
