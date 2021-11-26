/* eslint-disable no-param-reassign, no-console */
// If importing outside of demo project, should import CollectionAfterReadHook, CollectionBeforeChangeHook, etc
import { AfterChangeHook, AfterDeleteHook, AfterReadHook, BeforeChangeHook, BeforeDeleteHook, BeforeReadHook, CollectionConfig } from '../../src/collections/config/types';
import { FieldHook } from '../../src/fields/config/types';
import { Hook } from '../payload-types';

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
      ((operation) => {
        if (operation.req.headers.hook === 'beforeRead') {
          console.log('before reading Hooks document');
        }
      }) as BeforeReadHook<Hook>,
    ],
    beforeChange: [
      ((operation) => {
        if (operation.req.headers.hook === 'beforeChange') {
          operation.data.description += '-beforeChangeSuffix';
        }
        return operation.data;
      }) as BeforeChangeHook<Hook>,
    ],
    beforeDelete: [
      ((operation) => {
        if (operation.req.headers.hook === 'beforeDelete') {
          // TODO: Find a better hook operation to assert against in tests
          operation.req.headers.hook = 'afterDelete';
        }
      }) as BeforeDeleteHook,
    ],
    afterRead: [
      ((operation) => {
        const { doc } = operation;
        doc.afterReadHook = true;

        return doc;
      }) as AfterReadHook<Hook & { afterReadHook: boolean }>,
    ],
    afterChange: [
      ((operation) => {
        if (operation.req.headers.hook === 'afterChange') {
          operation.doc.afterChangeHook = true;
        }
        return operation.doc;
      }) as AfterChangeHook<Hook & { afterChangeHook: boolean }>,
    ],
    afterDelete: [
      ((operation) => {
        if (operation.req.headers.hook === 'afterDelete') {
          operation.doc.afterDeleteHook = true;
        }
        return operation.doc;
      }) as AfterDeleteHook,
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
          ({ value }) => (value ? value.toUpperCase() : null) as FieldHook<Hook, 'title'>,
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
