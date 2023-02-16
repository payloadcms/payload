import { CollectionConfig, FieldHook } from 'payload/types';

const populateFullTitle: FieldHook = async ({ data }) => (
  `${data.title} ${data.firstName} ${data.lastName}`
);

const Staff: CollectionConfig = {
  slug: 'staff',
  admin: {
    defaultColumns: ['fullTitle', 'location'],
    useAsTitle: 'fullTitle',
  },
  fields: [
    {
      name: 'fullTitle',
      type: 'text',
      hooks: {
        afterRead: [
          populateFullTitle,
        ],
      },
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
