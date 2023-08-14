import { AfterOperationHook, CollectionConfig } from '../../../../src/collections/config/types';
import { AfterOperation } from '../../payload-types';

export const afterOperationSlug = 'afterOperation';

const AfterOperation: CollectionConfig = {
  slug: afterOperationSlug,
  hooks: {
    // beforeRead: [(operation) => operation.doc],
    afterOperation: [
      async ({ result, operation, args }) => {
        if (operation === 'create') {
          console.log('create', result, args);
          if ('docs' in result) {
            return {
              ...result,
              docs: result.docs?.map((doc) => ({
                ...doc,
                title: 'Title created',
              })),
            };
          }

          return { ...result, title: 'Title created' };
        }
        if (operation === 'delete') {
          console.log('delete', result, args);
        }
        if (operation === 'deleteByID') {
          console.log('deleteByID', result, args);
        }
        if (operation === 'findByID') {
          console.log('find', result, args);
        }

        if (operation === 'find') {
          console.log('find', result, args);
          // only modify the first doc for `find` operations
          // this is so we can test against the other operations
          return {
            ...result,
            docs: result.docs?.map((doc, index) => (index === 0 ? {
              ...doc,
              title: 'Title read',
            } : doc)),
          };
        }

        if (operation === 'findByID') {
          return { ...result, title: 'Title read' };
        }

        if (operation === 'update') {
          if ('docs' in result) {
            return {
              ...result,
              docs: result.docs?.map((doc) => ({
                ...doc,
                title: 'Title updated',
              })),
            };
          }
        }

        if (operation === 'updateByID') {
          return { ...result, title: 'Title updated' };
        }

        return result;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
};

export default AfterOperation;
