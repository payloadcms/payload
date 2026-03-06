import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'
import {
  apiKeysSlug,
  BASE_PATH,
  namedSaveToJWTValue,
  partialDisableLocalStrategiesSlug,
  publicUsersSlug,
  saveToJWTKey,
  slug,
} from './shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

export default buildConfigWithDefaults({
  admin: {
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
      prefillOnly: true,
    },
    autoRefresh: true,
    components: {
      beforeDashboard: ['./BeforeDashboard.js#BeforeDashboard'],
      beforeLogin: ['./BeforeLogin.js#BeforeLogin'],
      views: {
        'create-first-user': {
          Component: './CreateFirstUser.js#CreateFirstUser',
          path: '/create-first-user',
          exact: true,
        },
      },
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
        forgotPassword: {
          expiration: 300000, // 5 minutes
        },
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
          name: 'loginMetadata',
          type: 'array',
          label: 'Login Metadata',
          fields: [
            {
              name: 'info',
              type: 'text',
            },
          ],
        },
        {
          name: 'namedSaveToJWT',
          type: 'text',
          defaultValue: namedSaveToJWTValue,
          label: 'Named Save To JWT',
          saveToJWT: saveToJWTKey,
        },
        {
          name: 'richText',
          type: 'richText',
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
        {
          // This is a uniquely identifiable field that we use to ensure it doesn't appear in the page source when unauthenticated
          // E.g. if the user is authenticated, it will appear in the both the client config
          name: 'shouldNotShowInClientConfigUnlessAuthenticated',
          type: 'text',
          access: {
            // Setting this forces the field to show up in the permissions object
            read: () => true,
          },
        },
      ],
    },
    {
      slug: partialDisableLocalStrategiesSlug,
      auth: {
        disableLocalStrategy: {
          // optionalPassword: true,
          enableFields: true,
        },
      },
      fields: [
        // with `enableFields: true`, the following DB columns will be created:
        // email
        // reset_password_token
        // reset_password_expiration
        // salt
        // hash
        // login_attempts
        // lock_until
      ],
    },
    {
      slug: 'disable-local-strategy-password',
      auth: { disableLocalStrategy: true },
      fields: [
        {
          name: 'password',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: apiKeysSlug,
      access: {
        read: ({ req: { user } }) => {
          if (!user) {
            return false
          }
          if (user?.collection === apiKeysSlug) {
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
      slug: publicUsersSlug,
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
    {
      slug: 'api-keys-with-field-read-access',
      auth: {
        disableLocalStrategy: true,
        useAPIKey: true,
      },
      fields: [
        {
          name: 'enableAPIKey',
          type: 'checkbox',
          access: {
            read: () => false,
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
      labels: {
        plural: 'API Keys With Field Read Access',
        singular: 'API Key With Field Read Access',
      },
    },
  ],
  onInit: seed,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
