import { CollectionConfig } from '../../../src/collections/config/types';

export const Orders: CollectionConfig = {
  slug: 'order',
  admin: {
    group: {
      en: 'Orders Group',
      ar: 'مجموعة المنتجات',
    },
  },
  fields: [
    {
      name: 'total',
      type: 'number',
      required: true,
    },

  ],
};
