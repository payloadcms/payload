import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    create: () => true,
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      label: 'Name',
      type: 'text',
    }
  ],
};

export default Users;