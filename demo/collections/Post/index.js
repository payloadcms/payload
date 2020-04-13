const path = require('path');
const checkRole = require('../../policies/checkRole');

module.exports = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  useAsTitle: 'title',
  policies: {
    create: user => checkRole(['user', 'admin'], user),
    read: () => true,
    update: user => checkRole(['user', 'admin'], user),
    delete: user => checkRole(['user', 'admin'], user),
  },
  hooks: {
    beforeCreate: value => value,
    afterCreate: value => value,
    beforeRead: (query, options) => [query, options],
    afterRead: (options, value) => value,
    beforeUpdate: value => value,
    afterUpdate: value => value,
    beforeDelete: value => value,
    afterDelete: value => value,
  },
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
        beforeRead: value => value,
        beforeChange: value => value,
        afterChange: value => value,
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
    {
      name: 'startDate',
      label: 'Example Start Date',
      type: 'date',
      placeholder: 'test',
      width: 50,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: true,
    },
  ],
  timestamps: true,
};
