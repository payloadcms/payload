const LocalizedArrays = {
  slug: 'localized-arrays',
  labels: {
    singular: 'Localized Array',
    plural: 'Localized Arrays',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'array',
      label: 'Array',
      name: 'array',
      localized: true,
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'arrayText1',
              label: 'Array Text 1',
              type: 'text',
              required: true,
            }, {
              name: 'arrayText2',
              label: 'Array Text 2',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          type: 'text',
          name: 'arrayText3',
          label: 'Array Text 3',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
  timestamps: true,
};

export default LocalizedArrays;
