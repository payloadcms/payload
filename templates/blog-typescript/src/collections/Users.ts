import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeRead: [({ req: { user, data }}) => {
      data.email = undefined;
    }]
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