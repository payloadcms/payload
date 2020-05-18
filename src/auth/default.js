const defaultUser = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  useAsTitle: 'username',
  auth: {
    tokenExpiration: 7200,
  },
  timestamps: true,
};

module.exports = defaultUser;
