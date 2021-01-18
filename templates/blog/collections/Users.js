const onlyNameIfPublic = ({ req: { user }, doc }) => {
  // Only return name if not logged in
  if (!user) {
    return { name: doc.name };
  }
  return doc;
};

const Users = {
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
      label: 'Name',
      type: 'text',
    }
  ],
};

export default Users;