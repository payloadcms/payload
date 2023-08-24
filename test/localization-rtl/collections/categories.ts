import { CollectionConfig } from '../../../src/collections/config/types';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id', 'archived'],
    group: {
      en: 'Orders Group',
      ar: 'مجموعة المنتجات',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Archiving filters it from being an option in the posts collection',
      },
    },
  ],
};
