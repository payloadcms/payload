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
      },
    },
  ],
  timestamps: true,
  components: {
    views: {
      List: path.resolve(__dirname, 'components/views/List/index.js'),
    },
  },
};
