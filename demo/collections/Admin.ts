import { CollectionConfig } from '../../src/collections/config/types';
import roles from '../access/roles';
import checkRole from '../access/checkRole';

const access = ({ req: { user } }) => {
  const result = checkRole(['admin'], user);
  return result;
};

const Admin: CollectionConfig = {
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
      sameSite: 'lax',
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
      name: 'publicUser',
      type: 'relationship',
      hasMany: true,
      relationTo: 'public-users',
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        read: ({ req: { user } }) => checkRole(['admin'], user),
      },
    },
  ],
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
};

export default Admin;
