const LocalizedRepeaters = {
  slug: 'localized-repeaters',
  labels: {
    singular: 'Localized Repeater',
    plural: 'Localized Repeaters',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'repeater',
      label: 'Repeater',
      name: 'repeater',
      localized: true,
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'repeaterText1',
              label: 'Repeater Text 1',
              type: 'text',
              required: true,
            }, {
              name: 'repeaterText2',
              label: 'Repeater Text 2',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          type: 'text',
          name: 'repeaterText3',
          label: 'Repeater Text 3',
          readOnly: true,
        },
      ],
    },
  ],
  timestamps: true,
};

module.exports = LocalizedRepeaters;
