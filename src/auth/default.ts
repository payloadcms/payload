const defaultUser = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
  },
  fields: [],
  timestamps: true,
};

module.exports = defaultUser;
