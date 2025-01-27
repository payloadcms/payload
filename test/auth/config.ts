import { v4 as uuid } from 'uuid'

import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { AuthDebug } from './AuthDebug'
import { apiKeysSlug, namedSaveToJWTValue, saveToJWTKey, slug } from './shared'

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
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
          name: 'adminOnlyField',
          type: 'text',
          access: {
            read: ({
              req: {
                user: { roles = [] },
              },
            }) => {
              return roles.includes('admin')
            },
          },
        },
        {
          name: 'roles',
          label: 'Role',
          type: 'select',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: ['user'],
          required: true,
          saveToJWT: true,
          hasMany: true,
        },
        {
          name: 'namedSaveToJWT',
          label: 'Named Save To JWT',
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
              label: 'Lifted Save To JWT',
              type: 'text',
              saveToJWT: 'x-lifted-from-group',
              defaultValue: 'lifted from group',
            },
          ],
        },
        {
          name: 'groupSaveToJWT',
          label: 'Group Save To JWT',
          type: 'group',
          saveToJWT: 'x-group',
          fields: [
            {
              name: 'saveToJWTString',
              label: 'Save To JWT String',
              type: 'text',
              saveToJWT: 'x-test',
              defaultValue: 'nested property',
            },
            {
              name: 'saveToJWTFalse',
              label: 'Save To JWT False',
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
              label: 'Save To JWT Tab',
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
              label: 'Tab Save To JWT String',
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
                  label: 'Tab Lifted Save To JWT',
                  type: 'text',
                  saveToJWT: true,
                  defaultValue: 'lifted from unnamed tab',
                },
                {
                  name: 'unnamedTabSaveToJWTString',
                  label: 'Unnamed Tab Save To JWT String',
                  type: 'text',
                  saveToJWT: 'x-tab-field',
                  defaultValue: 'text',
                },
                {
                  name: 'unnamedTabSaveToJWTFalse',
                  label: 'Unnamed Tab Save To JWT False',
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
      slug: apiKeysSlug,
      access: {
        read: ({ req: { user } }) => {
          if (user.collection === 'api-keys') {
            return {
              id: {
                equals: user.id,
              },
            }
          }
          return true
        },
      },
      auth: {
        disableLocalStrategy: true,
        useAPIKey: true,
      },
      fields: [],
      labels: {
        plural: 'API Keys',
        singular: 'API Key',
      },
    },
    {
      slug: 'public-users',
      auth: {
        verify: true,
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
    })

    await payload.create({
      collection: 'api-keys',
      data: {
        apiKey: uuid(),
        enableAPIKey: true,
      },
    })

    await payload.create({
      collection: 'api-keys',
      data: {
        apiKey: uuid(),
        enableAPIKey: true,
      },
    })
  },
})
