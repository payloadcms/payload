import { CollectionBeforeReadHook, CollectionConfig } from 'payload/types';

const onlyNameIfPublic: CollectionBeforeReadHook = ({ req: { user }, doc }) => {
  // Only return name if not logged in
  if (!user) {
    return { name: doc.name };
  }
  return doc;
};

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
    beforeRead: [onlyNameIfPublic]
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
    }
  ],
};

export default Users;