import { CollectionConfig } from '../../../src/collections/config/types';

export const People: CollectionConfig = {
  slug: 'people',
  fields: [
    {
      name: 'fullName',
      type: 'text',
    },
  ],
};
