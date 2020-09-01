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
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      domain: undefined,
    },
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
    {
      name: 'apiKey',
      access: {
        read: ({ req: { user } }) => {
          if (checkRole(['admin'], user)) {
            return true;
          }

          if (user) {
            return {
              email: user.email,
            };
          }

          return false;
        },
      },
    },
  ],
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
};
