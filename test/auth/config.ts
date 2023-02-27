import { v4 as uuid } from 'uuid';
import { mapAsync } from '../../src/utilities/mapAsync';
import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';

export const slug = 'users';

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug,
      auth: {
        tokenExpiration: 7200, // 2 hours
        verify: false,
        maxLoginAttempts: 2,
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
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: 'user',
          required: true,
          saveToJWT: true,
          hasMany: true,
        },
      ],
    },
    {
      slug: 'api-keys',
      access: {
        read: ({ req: { user } }) => {
          if (user.collection === 'api-keys') {
            return {
              id: {
                equals: user.id,
              },
            };
          }
          return true;
        },
      },
      auth: {
        disableLocalStrategy: true,
        useAPIKey: true,
      },
      fields: [],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await mapAsync([...Array(2)], async () => {
      await payload.create({
        collection: 'api-keys',
        data: {
          apiKey: uuid(),
          enableAPIKey: true,
        },
      });
    });
  },
});
