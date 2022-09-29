import { CollectionConfig } from 'payload/types';

const Products: CollectionConfig = {
  slug: 'products',
  timestamps: true,
  admin: {
    defaultColumns: [
      'name',
    ]
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
    },
  ]
}

export default Products;
