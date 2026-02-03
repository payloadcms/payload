import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { Config, FieldAccess } from 'payload'

import { buildEditorState, type DefaultNodeTypes } from '@payloadcms/richtext-lexical'

import type { User } from './payload-types.js'

import { devUser } from '@tools/test-utils/shared'
import { Auth } from './collections/Auth/index.js'
import { BlocksFieldAccess } from './collections/BlocksFieldAccess/index.js'
import { Disabled } from './collections/Disabled/index.js'
import { Hooks } from './collections/hooks/index.js'
import { ReadRestricted } from './collections/ReadRestricted/index.js'
import { seedReadRestricted } from './collections/ReadRestricted/seed.js'
import { Regression1 } from './collections/Regression-1/index.js'
import { Regression2 } from './collections/Regression-2/index.js'
import { RichText } from './collections/RichText/index.js'
import {
  blocksFieldAccessSlug,
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

function isUser(user?: any): user is {
  collection: 'users'
} & User {
  if (!user) {
    return false
  }
  return user?.collection === 'users'
}

export const getConfig: () => Partial<Config> = () => ({
  admin: {
    autoLogin: false,
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  blocks: [
    {
      slug: 'titleblock',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
      ],
    },
  ],
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
        unlock: ({ req }) => {
          if (req.user && req.user.collection === 'users') {
            // admin users can only unlock themselves
            return {
              id: {
                equals: req.user.id,
              },
            }
          }

          return false
        },
      },
      auth: true,
      fields: [
        {
          name: 'roles',
          type: 'select',
          access: {
            create: ({ req }) => Boolean(isUser(req.user) && req.user?.roles?.includes('admin')),
            read: () => false,
            update: ({ req }) => {
              return Boolean(isUser(req.user) && req.user?.roles?.includes('admin'))
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
          name: 'info',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
          ],
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
        {
          name: 'hiddenWithDefault',
          type: 'text',
          hidden: true,
          defaultValue: 'default value',
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
    BlocksFieldAccess,
    Disabled,
    RichText,
    Regression1,
    Regression2,
    Hooks,
    Auth,
    ReadRestricted,
    {
      slug: 'field-restricted-update-based-on-data',
      fields: [
        {
          name: 'restricted',
          type: 'text',
          access: {
            update: ({ data }) => {
              return !data?.isRestricted
            },
          },
        },
        {
          name: 'doesNothing',
          type: 'checkbox',
        },
        {
          name: 'isRestricted',
          type: 'checkbox',
        },
      ],
    },
    // Collection for testing where query cache with SAME where queries
    {
      slug: 'where-cache-same',
      access: {
        // All operations return the same where query
        read: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { userRole: { equals: 'admin' } }
          }
          return false
        },
        update: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { userRole: { equals: 'admin' } }
          }
          return false
        },
        delete: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { userRole: { equals: 'admin' } }
          }
          return false
        },
        create: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'userRole',
          type: 'text',
          required: true,
        },
      ],
    },

    // Collection for testing where query cache with UNIQUE where queries
    {
      slug: 'where-cache-unique',
      access: {
        // Each operation returns a unique where query
        read: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { readRole: { equals: 'admin' } }
          }
          return false
        },
        update: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { updateRole: { equals: 'admin' } }
          }
          return false
        },
        delete: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { deleteRole: { equals: 'admin' } }
          }
          return false
        },
        create: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'readRole',
          type: 'text',
          required: true,
        },
        {
          name: 'updateRole',
          type: 'text',
          required: true,
        },
        {
          name: 'deleteRole',
          type: 'text',
          required: true,
        },
      ],
    },
    // Collection for testing async parent permission inheritance
    {
      slug: 'async-parent',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'parentField',
          type: 'group',
          access: {
            read: async ({ req: { user } }) => {
              // Simulate async permission check
              await new Promise((resolve) => setTimeout(resolve, 1))
              return Boolean(isUser(user) && user.roles?.includes('admin'))
            },
            update: async ({ req: { user } }) => {
              await new Promise((resolve) => setTimeout(resolve, 1))
              return Boolean(isUser(user) && user.roles?.includes('admin'))
            },
          },
          fields: [
            {
              name: 'childField1',
              type: 'text',
              // No access control - should inherit from parent
            },
            {
              name: 'childField2',
              type: 'textarea',
              // No access control - should inherit from parent
            },
            {
              name: 'nestedGroup',
              type: 'group',
              // No access control - should inherit from parent
              fields: [
                {
                  name: 'deepChild1',
                  type: 'text',
                  // No access control - should inherit from grandparent
                },
                {
                  name: 'deepChild2',
                  type: 'number',
                  // No access control - should inherit from grandparent
                },
              ],
            },
          ],
        },
      ],
    },
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
      collection: blocksFieldAccessSlug,
      data: {
        title: 'Blocks Field Access Test Document',
        editableBlocks: [
          {
            blockType: 'testBlock',
            title: 'Editable Block',
            content: 'This block should be fully editable',
          },
        ],
        readOnlyBlocks: [
          {
            blockType: 'testBlock2',
            title: 'Read-Only Block',
            content: 'This block should be read-only due to field access control',
          },
        ],
        editableBlockRefs: [
          {
            blockType: 'titleblock',
            title: 'Editable Block Reference',
          },
        ],
        readOnlyBlockRefs: [
          {
            blockType: 'titleblock',
            title: 'Read-Only Block Reference',
          },
        ],
        tabReadOnlyTest: {
          tabReadOnlyBlocks: [
            {
              blockType: 'testBlock3',
              title: 'Tab Read-Only Block',
              content: 'This block is read-only and inside a tab',
            },
          ],
          tabReadOnlyBlockRefs: [
            {
              blockType: 'titleblock',
              title: 'Tab Read-Only Block Reference',
            },
          ],
        },
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
        richText4: buildEditorState<DefaultNodeTypes>({ text: 'Text1' }),
        array: [{ art: buildEditorState<DefaultNodeTypes>({ text: 'Text2' }) }],
        arrayWithAccessFalse: [
          { richText6: buildEditorState<DefaultNodeTypes>({ text: 'Text3' }) },
        ],
        group1: {
          text: 'Text4',
          richText1: buildEditorState<DefaultNodeTypes>({ text: 'Text5' }),
        },
        blocks: [
          {
            blockType: 'myBlock3',
            richText7: buildEditorState<DefaultNodeTypes>({ text: 'Text6' }),
            blockName: 'My Block 1',
          },
        ],
        blocks3: [
          {
            blockType: 'myBlock2',
            richText5: buildEditorState<DefaultNodeTypes>({ text: 'Text7' }),
            blockName: 'My Block 2',
          },
        ],
        tab1: {
          richText2: buildEditorState<DefaultNodeTypes>({ text: 'Text8' }),
          blocks2: [
            {
              blockType: 'myBlock',
              richText3: buildEditorState<DefaultNodeTypes>({ text: 'Text9' }),
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
            richText2: buildEditorState<DefaultNodeTypes>({ text: 'Text1' }),
          },
        ],
        group: {
          text: 'Text2',
          richText1: buildEditorState<DefaultNodeTypes>({ text: 'Text3' }),
        },
      },
    })

    // Seed read-restricted collection
    await seedReadRestricted(payload)
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
