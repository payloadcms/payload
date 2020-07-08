const roles = require('../access/roles');
const checkRole = require('../access/checkRole');

const access = ({ req: { user } }) => {
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
  access: {
    create: access,
    read: access,
    update: access,
    delete: access,
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
