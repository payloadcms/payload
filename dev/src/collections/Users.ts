import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
  },
  admin: {
    useAsTitle: 'upn',
  },
  access: {
    read: () => true,
  },
  fields: [
    // no fields in this demo necessary
  ],
};

export default Users;
