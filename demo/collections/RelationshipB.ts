import { CollectionConfig } from '../../src/collections/config/types';

const RelationshipB: CollectionConfig = {
  slug: 'relationship-b',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  labels: {
    singular: 'Relationship B',
    plural: 'Relationship B',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: 'relationship-a',
      localized: false,
      hasMany: true,
    },
    {
      name: 'postManyRelationships',
      label: 'Post Many Relationships',
      type: 'relationship',
      relationTo: ['relationship-a', 'media'],
      localized: true,
      hasMany: false,
    },
    {
      name: 'localizedPosts',
      label: 'Localized Posts',
      type: 'relationship',
      hasMany: true,
      relationTo: ['localized-posts', 'previewable-post'],
    },
    {
      name: 'nonLocalizedRelationToMany',
      type: 'relationship',
      relationTo: ['localized-posts', 'relationship-a'],
    },
    {
      name: 'strictAccess',
      type: 'relationship',
      relationTo: 'strict-access',
    },
  ],
  timestamps: true,
};

export default RelationshipB;
