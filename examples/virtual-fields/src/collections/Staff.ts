import { CollectionAfterReadHook, CollectionConfig } from 'payload/types';

const populateFullTitle: CollectionAfterReadHook = async ({ doc }) => {
  const fullTitle = `${doc.title} ${doc.firstName} ${doc.lastName}`;

  return {
    ...doc,
    fullTitle,
  };
};

const Staff: CollectionConfig = {
  slug: 'staff',
  admin: {
    defaultColumns: ['fullTitle', 'location'],
    useAsTitle: 'fullTitle',
  },
  hooks: {
    afterRead: [populateFullTitle],
  },
  fields: [
    {
      name: 'fullTitle',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      maxDepth: 0,
      hasMany: true,
      required: true,
    },
  ],
};

export default Staff;
