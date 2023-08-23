import { Payload } from '../../../../src/payload';
import { BeforeLoginHook, CollectionConfig } from '../../../../src/collections/config/types';
import { AuthenticationError } from '../../../../src/errors';
import { devUser, regularUser } from '../../../credentials';

const beforeLoginHook: BeforeLoginHook = ({ user, req }) => {
  const isAdmin = user.roles.includes('admin') ? user : undefined;
  if (!isAdmin) {
    throw new AuthenticationError(req.t);
  }
  return user;
};

export const seedHooksUsers = async (payload: Payload) => {
  await payload.create({
    collection: hooksUsersSlug,
    data: devUser,
  });
  await payload.create({
    collection: hooksUsersSlug,
    data: regularUser,
  });
};

export const hooksUsersSlug = 'hooks-users';
const Users: CollectionConfig = {
  slug: hooksUsersSlug,
  auth: true,
  fields: [
    {
      name: 'roles',
      label: 'Role',
      type: 'select',
      options: ['admin', 'user'],
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      hasMany: true,
    },
  ],
  hooks: {
    beforeLogin: [beforeLoginHook],
  },
};

export default Users;
