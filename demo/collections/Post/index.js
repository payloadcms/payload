/* eslint-disable no-underscore-dangle */
const path = require('path');
const checkRole = require('../../policies/checkRole');

module.exports = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  useAsTitle: 'title',
  preview: (doc, token) => {
    if (doc.title) {
      return `http://localhost:3000/posts/${doc.title.value}?preview=true&token=${token}`;
    }

    return null;
  },
  policies: {
    create: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    read: () => true,
    update: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    delete: ({ req: { user } }) => checkRole(['user', 'admin'], user),
  },
  hooks: {
    beforeCreate: operation => operation,
    beforeRead: operation => operation,
    beforeUpdate: operation => operation,
    beforeDelete: (operation) => {
      console.log(`About to delete ${operation.id}`);
      return operation;
    },
    afterCreate: (operation, value) => value,
    afterRead: (operation) => {
      const { json } = operation;
      json.afterReadHook = true;
    },
    afterUpdate: (operation, value) => value,
    afterDelete: (operation, value) => {
      console.log(`Deleted ${value.id}`);
      console.log(`Deleted record: ${JSON.stringify(value)}`);
      return value;
    },
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
