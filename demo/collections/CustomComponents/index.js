const path = require('path');

module.exports = {
  slug: 'custom-components',
  labels: {
    singular: 'Custom Component',
    plural: 'Custom Components',
  },
  useAsTitle: 'title',
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
      hooks: {
        beforeCreate: operation => operation.value,
        beforeUpdate: operation => operation.value,
        afterRead: operation => operation.value,
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
      components: {
        field: path.resolve(__dirname, 'components/fields/Description/Field/index.js'),
        cell: path.resolve(__dirname, 'components/fields/Description/Cell/index.js'),
        filter: path.resolve(__dirname, 'components/fields/Description/Filter/index.js'),
      },
    },
    {
      name: 'repeater',
      label: 'Repeater',
      type: 'repeater',
      fields: [
        {
          type: 'text',
          name: 'nestedRepeaterCustomField',
          label: 'Nested Repeater Custom Field',
          components: {
            field: path.resolve(__dirname, 'components/fields/NestedRepeaterCustomField/Field/index.js'),
          },
        },
      ],
    },
    {
      name: 'group',
      label: 'Group',
      type: 'group',
      fields: [
        {
          type: 'text',
          name: 'nestedGroupCustomField',
          label: 'Nested Group Custom Field',
          components: {
            field: path.resolve(__dirname, 'components/fields/NestedGroupCustomField/Field/index.js'),
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nestedText1',
          label: 'Nested Text 1',
          type: 'text',
          components: {
            field: path.resolve(__dirname, 'components/fields/NestedText1/Field/index.js'),
          },
        }, {
          name: 'nestedText2',
          label: 'Nested Text 2',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
  components: {
    views: {
      List: path.resolve(__dirname, 'components/views/List/index.js'),
    },
  },
};
