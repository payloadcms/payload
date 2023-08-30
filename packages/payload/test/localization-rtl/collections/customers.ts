import { CollectionConfig } from '../../../src/collections/config/types';

export const Customers: CollectionConfig = {
  slug: 'customers',
  fields: [
    {
      name: 'total',
      type: 'number',
      required: true,
      label: {
        ar: 'إجمالي',
        en: 'Total',
      },
    },
    {
      name: 'name',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        ar: 'إسم الزبون',
        en: 'Customer Name',
      },
    },
  ],
};
