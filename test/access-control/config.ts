import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { FieldAccess } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { TestButton } from './TestButton.js'
import {
  createNotUpdateCollectionSlug,
  docLevelAccessSlug,
  firstArrayText,
  fullyRestrictedSlug,
  hiddenAccessCountSlug,
  hiddenAccessSlug,
  hiddenFieldsSlug,
  noAdminAccessEmail,
  nonAdminUserEmail,
  nonAdminUserSlug,
  readNotUpdateGlobalSlug,
  readOnlyGlobalSlug,
  readOnlySlug,
  relyOnRequestHeadersSlug,
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
  read: () => true,
  update: () => true,
  delete: () => true,
}

const PublicReadabilityAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  if (user) return true
  if (siblingData?.allowPublicReadability) return true

  return false
}

export const requestHeaders = new Headers({ authorization: 'Bearer testBearerToken' })
const UseRequestHeadersAccess: FieldAccess = ({ req: { headers } }) => {
  return !!headers && headers.get('authorization') === requestHeaders.get('authorization')
}

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: false,
  },
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          type: 'checkbox',
          name: 'test',
          label: 'Allow access to test global',
        },
      ],
      admin: {
        components: {
          elements: {
            SaveButton: TestButton,
          },
        },
      },
    },
    {
      slug: 'test',
      fields: [],
      access: {
        read: async ({ req: { payload } }) => {
          const access = await payload.findGlobal({ slug: 'settings' })
          return Boolean(access.test)
        },
      },
    },
    {
      slug: readOnlyGlobalSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        read: () => true,
        update: () => false,
      },
    },
    {
      slug: userRestrictedGlobalSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        read: () => true,
        update: ({ req, data }) => data?.name === req.user?.email,
      },
    },
    {
      slug: readNotUpdateGlobalSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        read: () => true,
        update: () => false,
      },
    },
  ],
  collections: [
    {
      slug: 'users',
      auth: true,
      access: {
        // admin:  () => true,
        admin: async ({ req }) => {
          if (req.user?.email === noAdminAccessEmail) {
            return false
          }

          return new Promise((resolve) => {
            // Simulate a request to an external service to determine access, i.e. another instance of Payload
            setTimeout(resolve, 50, true) // set to 'true' or 'false' here to simulate the response
          })
        },
      },
      fields: [
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: ['admin', 'user'],
          defaultValue: ['user'],
          access: {
            create: ({ req }) => req.user?.roles?.includes('admin'),
            read: () => false,
            update: ({ req }) => {
              return req.user?.roles?.includes('admin')
            },
          },
        },
      ],
    },
    {
      slug: nonAdminUserSlug,
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
          type: 'group',
          name: 'group',
          fields: [
            {
              name: 'restrictedGroupText',
              type: 'text',
              access: {
                read: () => false,
                update: () => false,
                create: () => false,
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
                read: () => false,
                update: () => false,
                create: () => false,
              },
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Access',
          fields: [
            {
              name: 'restrictedCollapsibleText',
              type: 'text',
              access: {
                read: () => false,
                update: () => false,
                create: () => false,
              },
            },
          ],
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
          relationTo: userRestrictedCollectionSlug,
          hasMany: true,
        },
        {
          name: 'createNotUpdateDocs',
          type: 'relationship',
          relationTo: createNotUpdateCollectionSlug,
          hasMany: true,
        },
      ],
    },
    {
      slug: fullyRestrictedSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: readOnlySlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => false,
        read: () => true,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: userRestrictedCollectionSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => true,
        read: () => true,
        update: ({ req }) => ({
          name: {
            equals: req.user?.email,
          },
        }),
        delete: () => false,
      },
    },
    {
      slug: createNotUpdateCollectionSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => true,
        read: () => true,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: restrictedVersionsSlug,
      versions: true,
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
      access: {
        read: ({ req: { user } }) => {
          if (user) return true

          return {
            hidden: {
              not_equals: true,
            },
          }
        },
        readVersions: ({ req: { user } }) => {
          if (user) return true

          return {
            'version.hidden': {
              not_equals: true,
            },
          }
        },
      },
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
                  label: 'Allow Public Readability',
                  type: 'checkbox',
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
        read: UseRequestHeadersAccess,
        update: UseRequestHeadersAccess,
        delete: UseRequestHeadersAccess,
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
      labels: {
        singular: 'Doc Level Access',
        plural: 'Doc Level Access',
      },
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
          localized: true,
          access: {
            update: (args) => {
              if (args?.doc?.lockTitle) {
                return false
              }
              return true
            },
          },
        },
        {
          name: 'lockTitle',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
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
          if (user) return true

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
          if (user) return true

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
        email: noAdminAccessEmail,
        password: 'test',
      },
    })

    await payload.create({
      collection: nonAdminUserSlug,
      data: {
        email: nonAdminUserEmail,
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
            text: firstArrayText,
            allowPublicReadability: true,
          },
          {
            text: secondArrayText,
            allowPublicReadability: false,
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
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
