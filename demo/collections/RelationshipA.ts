import { PayloadCollectionConfig } from '../../src/collections/config/types';

const RelationshipA: PayloadCollectionConfig = {
  slug: 'relationship-a',
  access: {
    read: () => true,
  },
  labels: {
    singular: 'Relationship A',
    plural: 'Relationship A',
  },
  fields: [
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: 'relationship-b',
      localized: true,
    },
    {
      name: 'LocalizedPost',
      label: 'Localized Post',
      type: 'relationship',
      relationTo: 'localized-posts',
      hasMany: true,
      localized: true,
    },
    {
      name: 'postLocalizedMultiple',
      label: 'Localized Post Multiple',
      type: 'relationship',
      relationTo: ['localized-posts', 'all-fields'],
      hasMany: true,
      localized: true,
    },
    {
      name: 'postManyRelationships',
      label: 'Post Many Relationships',
      type: 'relationship',
      relationTo: ['relationship-b'],
      localized: true,
      hasMany: false,
    },
  ],
  timestamps: true,
};

export default RelationshipA;
