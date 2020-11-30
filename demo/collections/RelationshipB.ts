import { PayloadCollectionConfig } from '../../src/collections/config/types';

const RelationshipB: PayloadCollectionConfig = {
  slug: 'relationship-b',
  access: {
    read: () => true,
  },
  labels: {
    singular: 'Relationship B',
    plural: 'Relationship B',
  },
  fields: [
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: 'relationship-a',
      localized: false,
      hasMany: true,
    },
  ],
  timestamps: true,
};

export default RelationshipB;
