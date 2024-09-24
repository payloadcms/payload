import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { v4 as uuid } from 'uuid'

import { buildConfigWithDefaults } from '@test-utils/buildConfigWithDefaults.js'
import { devUser } from '@test-utils/credentials.js'
import { apiKeysSlug, namedSaveToJWTValue, saveToJWTKey, slug } from './shared.js'

export default buildConfigWithDefaults({
  admin: {
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
      prefillOnly: true,
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
  },
  collections: [
    {
      slug,
      admin: {
        useAsTitle: 'custom',
      },
      auth: {
        cookies: {
          domain: undefined,
          sameSite: 'Lax',
          secure: false,
        },
        depth: 0,
        lockTime: 600 * 1000, // lock time in ms
        maxLoginAttempts: 2,
        tokenExpiration: 7200, // 2 hours
        useAPIKey: true,
        verify: false,
      },
      fields: [
        {
          name: 'adminOnlyField',
          type: 'text',
          access: {
            read: ({ req: { user } }) => {
              return user?.roles?.includes('admin')
            },
          },
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['user'],
          hasMany: true,
          label: 'Role',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          required: true,
          saveToJWT: true,
        },
        {
          name: 'namedSaveToJWT',
          type: 'text',
          defaultValue: namedSaveToJWTValue,
          label: 'Named Save To JWT',
          saveToJWT: saveToJWTKey,
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'liftedSaveToJWT',
              type: 'text',
              defaultValue: 'lifted from group',
              label: 'Lifted Save To JWT',
              saveToJWT: 'x-lifted-from-group',
            },
          ],
        },
        {
          name: 'groupSaveToJWT',
          type: 'group',
          fields: [
            {
              name: 'saveToJWTString',
              type: 'text',
              defaultValue: 'nested property',
              label: 'Save To JWT String',
              saveToJWT: 'x-test',
            },
            {
              name: 'saveToJWTFalse',
              type: 'text',
              defaultValue: 'nested property',
              label: 'Save To JWT False',
              saveToJWT: false,
            },
          ],
          label: 'Group Save To JWT',
          saveToJWT: 'x-group',
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'saveToJWTTab',
              fields: [
                {
                  name: 'test',
                  type: 'text',
                  defaultValue: 'yes',
                  saveToJWT: 'x-field',
                },
              ],
              label: 'Save To JWT Tab',
              saveToJWT: true,
            },
            {
              name: 'tabSaveToJWTString',
              fields: [
                {
                  name: 'includedByDefault',
                  type: 'text',
                  defaultValue: 'yes',
                },
              ],
              label: 'Tab Save To JWT String',
              saveToJWT: 'tab-test',
            },
            {
              fields: [
                {
                  name: 'tabLiftedSaveToJWT',
                  type: 'text',
                  defaultValue: 'lifted from unnamed tab',
                  label: 'Tab Lifted Save To JWT',
                  saveToJWT: true,
                },
                {
                  name: 'unnamedTabSaveToJWTString',
                  type: 'text',
                  defaultValue: 'text',
                  label: 'Unnamed Tab Save To JWT String',
                  saveToJWT: 'x-tab-field',
                },
                {
                  name: 'unnamedTabSaveToJWTFalse',
                  type: 'text',
                  defaultValue: 'false',
                  label: 'Unnamed Tab Save To JWT False',
                  saveToJWT: false,
                },
              ],
              label: 'No Name',
            },
          ],
        },
        {
          name: 'custom',
          type: 'text',
          label: 'Custom',
        },
        {
          name: 'authDebug',
          type: 'ui',
          admin: {
            components: {
              Field: '/AuthDebug.js#AuthDebug',
            },
          },
          label: 'Auth Debug',
        },
      ],
    },
    {
      slug: apiKeysSlug,
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false
          if (user?.collection === 'api-keys') {
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
    {
      slug: 'relationsCollection',
      fields: [
        {
          name: 'rel',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    if (process.env.SKIP_ON_INIT !== 'true') {
      await payload.create({
        collection: 'users',
        data: {
          custom: 'Hello, world!',
          email: devUser.email,
          password: devUser.password,
          roles: ['admin'],
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
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
