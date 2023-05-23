import { CollectionConfig } from '../../../../src/collections/config/types';

export const afterOperationSlug = 'afterOperation';

const AfterOperation: CollectionConfig = {
  slug: afterOperationSlug,
  hooks: {
    beforeRead: [(operation) => operation.doc],
    afterOperation: [({ docs }) => docs.filter((doc) => !!doc.boolean)],
  },
  fields: [
    {
      name: 'boolean',
      type: 'checkbox',
      required: true,
    },
  ],
};

export default AfterOperation;
