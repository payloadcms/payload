import checkRole from '../access/checkRole';
import { CollectionConfig } from '../../src/collections/config/types';

const access = ({ req: { user } }) => checkRole(['admin'], user);

const PublicUsers: CollectionConfig = {
  slug: 'public-users',
  labels: {
    singular: 'Public User',
    plural: 'Public Users',
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: () => false,
    create: () => true,
    read: () => true,
    update: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          id: user.id,
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  auth: {
    tokenExpiration: 300,
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // lock time in ms
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: undefined,
    },
  },
  fields: [
    {
      name: 'adminOnly',
      label: 'This field should only be readable and editable by Admins with "admin" role',
      type: 'text',
      defaultValue: 'test',
      access: {
        create: access,
        read: access,
        update: access,
      },
    },
  ],
  timestamps: true,
};

export default PublicUsers;
