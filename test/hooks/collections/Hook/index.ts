/* eslint-disable no-param-reassign */
import { CollectionConfig } from '../../../../src/collections/config/types';
import { openAccess } from '../../../helpers/configHelpers';

export const hooksSlug = 'hooks';
const Hooks: CollectionConfig = {
  slug: hooksSlug,
  access: openAccess,
  hooks: {
    beforeValidate: [({ data }) => (validateHookOrder('collectionBeforeValidate', data))],
    beforeChange: [({ data }) => (validateHookOrder('collectionBeforeChange', data))],
    afterChange: [({ doc }) => (validateHookOrder('collectionAfterChange', doc))],
    beforeRead: [({ doc }) => (validateHookOrder('collectionBeforeRead', doc))],
    afterRead: [({ doc }) => (validateHookOrder('collectionAfterRead', doc))],
  },
  fields: [
    {
      name: 'fieldBeforeValidate',
      type: 'checkbox',
      hooks: {
        beforeValidate: [({ data }) => {
          data.fieldBeforeValidate = true;
          validateHookOrder('fieldBeforeValidate', data);
          return true;
        }],
      },
    },
    {
      name: 'fieldBeforeChange',
      type: 'checkbox',
      hooks: {
        beforeChange: [({ data }) => {
          data.fieldBeforeChange = true;
          validateHookOrder('fieldBeforeChange', data);
          return true;
        }],
      },
    },
    {
      name: 'fieldAfterChange',
      type: 'checkbox',
      hooks: {
        afterChange: [({ data }) => {
          data.fieldAfterChange = true;
          validateHookOrder('fieldAfterChange', data);
          return true;
        }],
      },
    },
    {
      name: 'fieldAfterRead',
      type: 'checkbox',
      hooks: {
        afterRead: [({ data }) => {
          data.fieldAfterRead = true;
          validateHookOrder('fieldAfterRead', data);
          return true;
        }],
      },
    },
    {
      name: 'collectionBeforeValidate',
      type: 'checkbox',
    },
    {
      name: 'collectionBeforeChange',
      type: 'checkbox',
    },
    {
      name: 'collectionAfterChange',
      type: 'checkbox',
    },
    {
      name: 'collectionBeforeRead',
      type: 'checkbox',
    },
    {
      name: 'collectionAfterRead',
      type: 'checkbox',
    },
  ],
};

const createHookOrder = [
  'fieldBeforeValidate',
  'collectionBeforeValidate',
  'collectionBeforeChange',
  'fieldBeforeChange',
  'fieldAfterRead',
  'fieldAfterChange',
  'collectionAfterChange',
];

const validateHookOrder = (check: string, data) => {
  let hasMatched;
  createHookOrder.forEach((hook) => {
    if (check === 'collectionBeforeRead' && !data.id) {
      data[check] = true;
    } else if (hook === check) {
      data[check] = true;
      hasMatched = true;
    } else if ((!hasMatched && !data[hook]) || (hasMatched && data[hook])) {
      // throw new Error(`${check} called before ${hook}`);
    }
  });
  return data;
};

export default Hooks;
