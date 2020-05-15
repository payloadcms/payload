/* eslint-disable no-param-reassign */
module.exports = {
  slug: 'hooktests',
  labels: {
    singular: 'HookTest',
    plural: 'HookTests',
  },
  useAsTitle: 'title',
  policies: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeCreate: (operation) => {
      console.log('EXECUTING HOOK: beforeCreate');
      if (operation.req.headers.hook === 'beforeCreate') {
        operation.req.body.description += '-beforeCreateSuffix';
      }
      return operation;
    },
    beforeRead: (operation) => {
      console.log('EXECUTING HOOK: beforeRead');
      if (operation.req.headers.hook === 'beforeRead') {
        operation.limit = 1;
      }
      return operation;
    },
    beforeUpdate: (operation) => {
      console.log(`EXECUTING HOOK: beforeCreate - id: ${operation.id}`);
      return operation;
    },
    beforeDelete: (operation) => {
      console.log(`EXECUTING HOOK: beforeDelete - id: ${operation.id}`);
      return operation;
    },
    afterCreate: (operation, value) => {
      console.log(`EXECUTING HOOK: afterCreate - id: ${value.id}`);
      return value;
    },
    afterRead: (operation) => {
      console.log('EXECUTING HOOK: afterRead');
      const { json } = operation;
      json.afterReadHook = true;
    },
    afterUpdate: (operation, value) => {
      console.log(`EXECUTING HOOK: afterUpdate - id: ${value.id}`);
      if (operation.req.headers.hook === 'afterUpdate') {
        value.afterUpdateHook = true;
      }
      return value;
    },
    afterDelete: (operation, value) => {
      console.log(`EXECUTING HOOK: afterDelete - id: ${value.id}`);
      if (operation.req.headers.hook === 'afterDelete') {
        value.afterDeleteHook = true;
      }
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
