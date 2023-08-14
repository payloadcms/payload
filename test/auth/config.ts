import { v4 as uuid } from 'uuid';
import { mapAsync } from '../../src/utilities/mapAsync';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { devUser } from '../credentials';
import { AuthDebug } from './AuthDebug';

export const slug = 'users';

export const namedSaveToJWTValue = 'namedSaveToJWT value';

export const saveToJWTKey = 'x-custom-jwt-property-name';

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: {
      email: 'test@example.com',
      password: 'test',
      prefillOnly: true,
    },
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
        {
          name: 'namedSaveToJWT',
          type: 'text',
          defaultValue: namedSaveToJWTValue,
          saveToJWT: saveToJWTKey,
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'liftedSaveToJWT',
              type: 'text',
              saveToJWT: 'x-lifted-from-group',
              defaultValue: 'lifted from group',
            },
          ],
        },
        {
          name: 'groupSaveToJWT',
          type: 'group',
          saveToJWT: 'x-group',
          fields: [
            {
              name: 'saveToJWTString',
              type: 'text',
              saveToJWT: 'x-test',
              defaultValue: 'nested property',
            },
            {
              name: 'saveToJWTFalse',
              type: 'text',
              saveToJWT: false,
              defaultValue: 'nested property',
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'saveToJWTTab',
              saveToJWT: true,
              fields: [
                {
                  name: 'test',
                  type: 'text',
                  saveToJWT: 'x-field',
                  defaultValue: 'yes',
                },
              ],
            },
            {
              name: 'tabSaveToJWTString',
              saveToJWT: 'tab-test',
              fields: [
                {
                  name: 'includedByDefault',
                  type: 'text',
                  defaultValue: 'yes',
                },
              ],
            },
            {
              label: 'No Name',
              fields: [
                {
                  name: 'tabLiftedSaveToJWT',
                  type: 'text',
                  saveToJWT: true,
                  defaultValue: 'lifted from unnamed tab',
                },
                {
                  name: 'unnamedTabSaveToJWTString',
                  type: 'text',
                  saveToJWT: 'x-tab-field',
                  defaultValue: 'text',
                },
                {
                  name: 'unnamedTabSaveToJWTFalse',
                  type: 'text',
                  saveToJWT: false,
                  defaultValue: 'false',
                },
              ],
            },
          ],
        },
        {
          name: 'custom',
          label: 'Custom',
          type: 'text',
        },
        {
          name: 'authDebug',
          label: 'Auth Debug',
          type: 'ui',
          admin: {
            components: {
              Field: AuthDebug,
            },
          },
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
        custom: 'Hello, world!',
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
