import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { FieldAccess } from 'payload'

import type { Config, User } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { textToLexicalJSON } from '../fields/collections/LexicalLocalized/textToLexicalJSON.js'
import { Disabled } from './collections/Disabled/index.js'
import { Hooks } from './collections/hooks/index.js'
import { Regression1 } from './collections/Regression-1/index.js'
import { Regression2 } from './collections/Regression-2/index.js'
import { RichText } from './collections/RichText/index.js'
import {
  createNotUpdateCollectionSlug,
  docLevelAccessSlug,
  firstArrayText,
  fullyRestrictedSlug,
  hiddenAccessCountSlug,
  hiddenAccessSlug,
  hiddenFieldsSlug,
  nonAdminEmail,
  publicUserEmail,
  publicUsersSlug,
  readNotUpdateGlobalSlug,
  readOnlyGlobalSlug,
  readOnlySlug,
  relyOnRequestHeadersSlug,
  restrictedVersionsAdminPanelSlug,
  restrictedVersionsSlug,
  secondArrayText,
  siblingDataSlug,
  slug,
  unrestrictedSlug,
  userRestrictedCollectionSlug,
  userRestrictedGlobalSlug,
} from './shared.js'

const openAccess = {
  create: () => true,
  delete: () => true,
  read: () => true,
  update: () => true,
}

const PublicReadabilityAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  if (user) {
    return true
  }
  if (siblingData?.allowPublicReadability) {
    return true
  }

  return false
}

export const requestHeaders = new Headers({ authorization: 'Bearer testBearerToken' })
const UseRequestHeadersAccess: FieldAccess = ({ req: { headers } }) => {
  return !!headers && headers.get('authorization') === requestHeaders.get('authorization')
}

function isUser(user: Config['user']): user is {
  collection: 'users'
} & User {
  return user?.collection === 'users'
}

export default buildConfigWithDefaults(
  {
    admin: {
      autoLogin: false,
      user: 'users',
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'users',
        access: {
          // admin:  () => true,
          admin: async ({ req }) => {
            if (req.user?.email === nonAdminEmail) {
              return false
            }

            return new Promise((resolve) => {
              // Simulate a request to an external service to determine access, i.e. another instance of Payload
              setTimeout(resolve, 50, true) // set to 'true' or 'false' here to simulate the response
            })
          },
        },
        auth: true,
        fields: [
          {
            name: 'roles',
            type: 'select',
            access: {
              create: ({ req }) => isUser(req.user) && req.user?.roles?.includes('admin'),
              read: () => false,
              update: ({ req }) => {
                return isUser(req.user) && req.user?.roles?.includes('admin')
              },
            },
            defaultValue: ['user'],
            hasMany: true,
            options: ['admin', 'user'],
          },
        ],
      },
      {
        slug: publicUsersSlug,
        auth: true,
        fields: [],
      },
      {
        slug,
        access: {
          ...openAccess,
          update: () => false,
        },
        fields: [
          {
            name: 'restrictedField',
            type: 'text',
            access: {
              read: () => false,
              update: () => false,
            },
          },
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'restrictedGroupText',
                type: 'text',
                access: {
                  create: () => false,
                  read: () => false,
                  update: () => false,
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'restrictedRowText',
                type: 'text',
                access: {
                  create: () => false,
                  read: () => false,
                  update: () => false,
                },
              },
            ],
          },
          {
            type: 'collapsible',
            fields: [
              {
                name: 'restrictedCollapsibleText',
                type: 'text',
                access: {
                  create: () => false,
                  read: () => false,
                  update: () => false,
                },
              },
            ],
            label: 'Access',
          },
        ],
      },
      {
        slug: unrestrictedSlug,
        fields: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'userRestrictedDocs',
            type: 'relationship',
            hasMany: true,
            relationTo: userRestrictedCollectionSlug,
          },
          {
            name: 'createNotUpdateDocs',
            type: 'relationship',
            hasMany: true,
            relationTo: createNotUpdateCollectionSlug,
          },
        ],
      },
      {
        slug: 'relation-restricted',
        access: {
          read: () => true,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'post',
            type: 'relationship',
            relationTo: slug,
          },
        ],
      },
      {
        slug: fullyRestrictedSlug,
        access: {
          create: () => false,
          delete: () => false,
          read: () => false,
          update: () => false,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: readOnlySlug,
        access: {
          create: () => false,
          delete: () => false,
          read: () => true,
          update: () => false,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: userRestrictedCollectionSlug,
        access: {
          create: () => true,
          delete: () => false,
          read: () => true,
          update: ({ req }) => ({
            name: {
              equals: req.user?.email,
            },
          }),
        },
        admin: {
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: createNotUpdateCollectionSlug,
        access: {
          create: () => true,
          delete: () => false,
          read: () => true,
          update: () => false,
        },
        admin: {
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: restrictedVersionsSlug,
        access: {
          read: ({ req: { user } }) => {
            if (user) {
              return true
            }

            return {
              hidden: {
                not_equals: true,
              },
            }
          },
          readVersions: ({ req: { user } }) => {
            if (user) {
              return true
            }

            return {
              'version.hidden': {
                not_equals: true,
              },
            }
          },
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'hidden',
            type: 'checkbox',
            hidden: true,
          },
        ],
        versions: true,
      },
      {
        slug: restrictedVersionsAdminPanelSlug,
        access: {
          read: ({ req: { user } }) => {
            if (user) {
              return true
            }
            return false
          },
          readVersions: () => {
            return {
              'version.hidden': {
                not_equals: true,
              },
            }
          },
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'hidden',
            type: 'checkbox',
          },
        ],
        versions: true,
      },
      {
        slug: siblingDataSlug,
        access: openAccess,
        fields: [
          {
            name: 'array',
            type: 'array',
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'allowPublicReadability',
                    type: 'checkbox',
                    label: 'Allow Public Readability',
                  },
                  {
                    name: 'text',
                    type: 'text',
                    access: {
                      read: PublicReadabilityAccess,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        slug: relyOnRequestHeadersSlug,
        access: {
          create: UseRequestHeadersAccess,
          delete: UseRequestHeadersAccess,
          read: UseRequestHeadersAccess,
          update: UseRequestHeadersAccess,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: docLevelAccessSlug,
        access: {
          delete: () => ({
            and: [
              {
                approvedForRemoval: {
                  equals: true,
                },
              },
            ],
          }),
        },
        fields: [
          {
            name: 'approvedForRemoval',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'approvedTitle',
            type: 'text',
            access: {
              update: (args) => {
                if (args?.doc?.lockTitle) {
                  return false
                }
                return true
              },
            },
            localized: true,
          },
          {
            name: 'lockTitle',
            type: 'checkbox',
            defaultValue: false,
          },
        ],
        labels: {
          plural: 'Doc Level Access',
          singular: 'Doc Level Access',
        },
      },
      {
        slug: hiddenFieldsSlug,
        access: openAccess,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'partiallyHiddenGroup',
            type: 'group',
            fields: [
              {
                name: 'name',
                type: 'text',
              },
              {
                name: 'value',
                type: 'text',
                hidden: true,
              },
            ],
          },
          {
            name: 'partiallyHiddenArray',
            type: 'array',
            fields: [
              {
                name: 'name',
                type: 'text',
              },
              {
                name: 'value',
                type: 'text',
                hidden: true,
              },
            ],
          },
          {
            name: 'hidden',
            type: 'checkbox',
            hidden: true,
          },
        ],
      },
      {
        slug: hiddenAccessSlug,
        access: {
          read: ({ req: { user } }) => {
            if (user) {
              return true
            }

            return {
              hidden: {
                not_equals: true,
              },
            }
          },
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'hidden',
            type: 'checkbox',
            hidden: true,
          },
        ],
      },
      {
        slug: hiddenAccessCountSlug,
        access: {
          read: ({ req: { user } }) => {
            if (user) {
              return true
            }

            return {
              hidden: {
                not_equals: true,
              },
            }
          },
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'hidden',
            type: 'checkbox',
            hidden: true,
          },
        ],
      },
      {
        slug: 'fields-and-top-access',
        access: {
          readVersions: () => ({
            'version.secret': {
              equals: 'will-success-access-read',
            },
          }),
          read: () => ({
            secret: {
              equals: 'will-success-access-read',
            },
          }),
        },
        versions: { drafts: true },
        fields: [
          {
            type: 'text',
            name: 'secret',
            access: { read: () => false },
          },
        ],
      },
      Disabled,
      RichText,
      Regression1,
      Regression2,
      Hooks,
    ],
    globals: [
      {
        slug: 'settings',
        admin: {
          components: {
            elements: {
              SaveButton: '/TestButton.js#TestButton',
            },
          },
        },
        fields: [
          {
            name: 'test',
            type: 'checkbox',
            label: 'Allow access to test global',
          },
        ],
      },
      {
        slug: 'test',
        access: {
          read: async ({ req: { payload } }) => {
            const access = await payload.findGlobal({ slug: 'settings' })
            return Boolean(access.test)
          },
        },
        fields: [],
      },
      {
        slug: readOnlyGlobalSlug,
        access: {
          read: () => true,
          update: () => false,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: userRestrictedGlobalSlug,
        access: {
          read: () => true,
          update: ({ data, req }) => data?.name === req.user?.email,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: readNotUpdateGlobalSlug,
        access: {
          read: () => true,
          update: () => false,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
    ],
    onInit: async (payload) => {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      await payload.create({
        collection: 'users',
        data: {
          email: nonAdminEmail,
          password: 'test',
        },
      })

      await payload.create({
        collection: publicUsersSlug,
        data: {
          email: publicUserEmail,
          password: 'test',
        },
      })

      await payload.create({
        collection: slug,
        data: {
          restrictedField: 'restricted',
        },
      })

      await payload.create({
        collection: readOnlySlug,
        data: {
          name: 'read-only',
        },
      })

      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'versioned',
        },
      })

      await payload.create({
        collection: siblingDataSlug,
        data: {
          array: [
            {
              allowPublicReadability: true,
              text: firstArrayText,
            },
            {
              allowPublicReadability: false,
              text: secondArrayText,
            },
          ],
        },
      })

      await payload.updateGlobal({
        slug: userRestrictedGlobalSlug,
        data: {
          name: 'dev@payloadcms.com',
        },
      })

      await payload.create({
        collection: 'regression1',
        data: {
          richText4: textToLexicalJSON({ text: 'Text1' }),
          array: [{ art: textToLexicalJSON({ text: 'Text2' }) }],
          arrayWithAccessFalse: [{ richText6: textToLexicalJSON({ text: 'Text3' }) }],
          group1: {
            text: 'Text4',
            richText1: textToLexicalJSON({ text: 'Text5' }),
          },
          blocks: [
            {
              blockType: 'myBlock3',
              richText7: textToLexicalJSON({ text: 'Text6' }),
              blockName: 'My Block 1',
            },
          ],
          blocks3: [
            {
              blockType: 'myBlock2',
              richText5: textToLexicalJSON({ text: 'Text7' }),
              blockName: 'My Block 2',
            },
          ],
          tab1: {
            richText2: textToLexicalJSON({ text: 'Text8' }),
            blocks2: [
              {
                blockType: 'myBlock',
                richText3: textToLexicalJSON({ text: 'Text9' }),
                blockName: 'My Block 3',
              },
            ],
          },
        },
      })

      await payload.create({
        collection: 'regression2',
        data: {
          array: [
            {
              richText2: textToLexicalJSON({ text: 'Text1' }),
            },
          ],
          group: {
            text: 'Text2',
            richText1: textToLexicalJSON({ text: 'Text3' }),
          },
        },
      })
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  {
    disableAutoLogin: true,
  },
)
