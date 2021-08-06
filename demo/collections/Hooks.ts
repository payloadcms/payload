/* eslint-disable no-param-reassign */

import { CollectionConfig } from '../../src/collections/config/types';

const Hooks: CollectionConfig = {
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
    beforeRead: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeRead') {
          console.log('before reading Hooks document');
        }
      },
    ],
    beforeChange: [
      (operation) => {
        if (operation.req.headers.hook === 'beforeChange') {
          operation.data.description += '-beforeChangeSuffix';
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
    afterRead: [
      (operation) => {
        const { doc } = operation;
        doc.afterReadHook = true;

        return doc;
      },
    ],
    afterChange: [
      (operation) => {
        if (operation.req.headers.hook === 'afterChange') {
          operation.doc.afterChangeHook = true;
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
          ({ value }) => (value ? value.toUpperCase() : null),
        ],
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};

export default Hooks;
