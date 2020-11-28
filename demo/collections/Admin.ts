import roles from '../access/roles';
import checkRole from '../access/checkRole';

const access = ({ req: { user } }) => {
  const result = checkRole(['admin'], user);
  return result;
};

export default {
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
    tokenExpiration: 7200, // 2 hours
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // lock time in ms
    useAPIKey: true,
    depth: 0,
    cookies: {
      secure: false,
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
      type: 'text',
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
    {
      name: 'upload',
      type: 'uploads',
    },
  ],
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
};
