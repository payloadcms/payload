const AllFields = {
  slug: 'all-fields',
  labels: {
    singular: 'All Fields',
    plural: 'All Fields',
  },
  preview: (doc, token) => {
    if (doc.text) {
      return `http://localhost:3000/previewable-posts/${doc.text.value}?preview=true&token=${token}`;
    }

    return null;
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
    },
    {
      name: 'select',
      label: 'Select',
      type: 'select',
      options: [{
        value: 'option-1',
        label: 'Option 1 Label',
      }, {
        value: 'option-2',
        label: 'Option 2 Label',
      }, {
        value: 'option-3',
        label: 'Option 3 Label',
      }, {
        value: 'option-4',
        label: 'Option 4 Label',
      }],
      defaultValue: 'option-1',
      required: true,
    },
    {
      name: 'select-many',
      label: 'Select w/ hasMany',
      type: 'select',
      options: [{
        value: 'option-1',
        label: 'Option 1 Label',
      }, {
        value: 'option-2',
        label: 'Option 2 Label',
      }, {
        value: 'option-3',
        label: 'Option 3 Label',
      }, {
        value: 'option-4',
        label: 'Option 4 Label',
      }],
      defaultValue: 'option-1',
      required: true,
      hasMany: true,
    },
    {
      name: 'checkbox',
      type: 'checkbox',
      label: 'Checkbox',
      position: 'sidebar',
    },
  ],
  timestamps: true,
};

module.exports = AllFields;
