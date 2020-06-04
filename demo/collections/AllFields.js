const AllFields = {
  slug: 'all-fields',
  labels: {
    singular: 'All Fields',
    plural: 'All Fields',
  },
  useAsTitle: 'text',
  preview: (doc, token) => {
    if (doc && doc.text) {
      return `http://localhost:3000/previewable-posts/${doc.text.value}?preview=true&token=${token}`;
    }

    return null;
  },
  policies: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
    },
    // {
    //   name: 'select',
    //   label: 'Select',
    //   type: 'select',
    //   options: [{
    //     value: 'option-1',
    //     label: 'Option 1 Label',
    //   }, {
    //     value: 'option-2',
    //     label: 'Option 2 Label',
    //   }, {
    //     value: 'option-3',
    //     label: 'Option 3 Label',
    //   }, {
    //     value: 'option-4',
    //     label: 'Option 4 Label',
    //   }],
    //   defaultValue: 'option-1',
    //   required: true,
    // },
    // {
    //   name: 'selectMany',
    //   label: 'Select w/ hasMany',
    //   type: 'select',
    //   options: [{
    //     value: 'option-1',
    //     label: 'Option 1 Label',
    //   }, {
    //     value: 'option-2',
    //     label: 'Option 2 Label',
    //   }, {
    //     value: 'option-3',
    //     label: 'Option 3 Label',
    //   }, {
    //     value: 'option-4',
    //     label: 'Option 4 Label',
    //   }],
    //   defaultValue: 'option-1',
    //   required: true,
    //   hasMany: true,
    // },
    // {
    //   name: 'checkbox',
    //   type: 'checkbox',
    //   label: 'Checkbox',
    //   position: 'sidebar',
    // },
    // {
    //   type: 'row',
    //   fields: [
    //     {
    //       name: 'email',
    //       label: 'Email',
    //       type: 'email',
    //     }, {
    //       name: 'number',
    //       label: 'Number',
    //       type: 'number',
    //     },
    //   ],
    // },
    // {
    //   type: 'group',
    //   label: 'Group',
    //   name: 'group',
    //   fields: [
    //     {
    //       type: 'row',
    //       fields: [
    //         {
    //           name: 'nestedText1',
    //           label: 'Nested Text 1',
    //           type: 'text',
    //         }, {
    //           name: 'nestedText2',
    //           label: 'Nested Text 2',
    //           type: 'text',
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      type: 'repeater',
      label: 'Repeater',
      name: 'repeater',
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
        },
      ],
    },
  ],
  timestamps: true,
};

module.exports = AllFields;
