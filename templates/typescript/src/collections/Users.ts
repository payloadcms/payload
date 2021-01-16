import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    create: () => true,
    // read: () => true,  // Only admin panel access until modified
    // update: () => true, // Only admin panel access until modified
    // delete: () => true, // Only admin panel access until modified

  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
};


export default Users;