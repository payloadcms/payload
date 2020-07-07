const roles = require('../policies/roles');
const checkRole = require('../policies/checkRole');

const policy = ({ req: { user } }) => {
  const result = checkRole(['admin'], user);
  return result;
};

module.exports = {
  slug: 'admins',
  labels: {
    singular: 'Admin',
    plural: 'Admins',
  },
  useAsTitle: 'email',
  policies: {
    create: policy,
    read: policy,
    update: policy,
    delete: policy,
    admin: () => true,
  },
  auth: {
    tokenExpiration: 7200,
    useAPIKey: true,
    secureCookie: process.env.NODE_ENV === 'production',
  },
  fields: [
    {
      name: 'roles',
      label: 'Role',
      type: 'select',
      options: roles,
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      hasMany: true,
    },
  ],
  timestamps: true,
};
