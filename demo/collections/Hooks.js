/* eslint-disable no-param-reassign */
module.exports = {
  slug: 'hooks',
  labels: {
    singular: 'Hook',
    plural: 'Hooks',
  },
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeCreate: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeCreate') {
          operation.req.body.description += '-beforeCreateSuffix';
        }
        return operation.data;
      },
    ],
    beforeRead: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeRead') {
          console.log('before reading Hooks document');
        }
      },
    ],
    beforeUpdate: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeUpdate') {
          operation.req.body.description += '-beforeUpdateSuffix';
        }
        return operation.data;
      },
    ],
    beforeDelete: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeDelete') {
          // TODO: Find a better hook operation to assert against in tests
          operation.req.headers.hook = 'afterDelete';
        }
      },
    ],
    afterCreate: [
      (operation) => {
        if (operation.req.headers.hook === 'afterCreate') {
          operation.doc.afterCreateHook = true;
        }
        return operation.doc;
      },
    ],
    afterRead: [
      (operation) => {
        const { doc } = operation;
        doc.afterReadHook = true;

        return doc;
      },
    ],
    afterUpdate: [
      (operation) => {
        if (operation.req.headers.hook === 'afterUpdate') {
          operation.doc.afterUpdateHook = true;
        }
        return operation.doc;
      },
    ],
    afterDelete: [
      (operation) => {
        if (operation.req.headers.hook === 'afterDelete') {
          operation.doc.afterDeleteHook = true;
        }
        return operation.doc;
      },
    ],
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
        afterRead: [
          (value) => (value ? value.toUpperCase() : null),
        ],
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
