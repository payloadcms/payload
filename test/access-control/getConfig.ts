import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { Config, FieldAccess } from 'payload'

import { buildEditorState, type DefaultNodeTypes } from '@payloadcms/richtext-lexical'

import type { User } from './payload-types.js'

import { devUser } from '../credentials.js'
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
    {
      slug: 'contentblock',
      fields: [
        {
          type: 'textarea',
          name: 'content',
        },
        {
          type: 'text',
          name: 'author',
        },
      ],
    },
    {
      slug: 'imageblock',
      fields: [
        {
          type: 'text',
          name: 'url',
        },
        {
          type: 'text',
          name: 'alt',
        },
        {
          type: 'number',
          name: 'width',
        },
        {
          type: 'number',
          name: 'height',
        },
      ],
    },
    {
      slug: 'videoblock',
      fields: [
        {
          type: 'text',
          name: 'videoUrl',
        },
        {
          type: 'checkbox',
          name: 'autoplay',
        },
        {
          type: 'textarea',
          name: 'caption',
        },
      ],
    },
    {
      slug: 'quoteblock',
      fields: [
        {
          type: 'textarea',
          name: 'quote',
        },
        {
          type: 'text',
          name: 'attribution',
        },
        {
          type: 'text',
          name: 'role',
        },
      ],
    },
    {
      slug: 'codeblock',
      fields: [
        {
          type: 'code',
          name: 'code',
        },
        {
          type: 'text',
          name: 'language',
        },
        {
          type: 'checkbox',
          name: 'showLineNumbers',
        },
      ],
    },
    {
      slug: 'calloutblock',
      fields: [
        {
          type: 'select',
          name: 'type',
          options: ['info', 'warning', 'error', 'success'],
        },
        {
          type: 'textarea',
          name: 'message',
        },
      ],
    },
    {
      slug: 'statsblock',
      fields: [
        {
          type: 'text',
          name: 'label',
        },
        {
          type: 'number',
          name: 'value',
        },
        {
          type: 'text',
          name: 'unit',
        },
      ],
    },
    {
      slug: 'featureblock',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          type: 'textarea',
          name: 'description',
        },
        {
          type: 'text',
          name: 'icon',
        },
      ],
    },
    {
      slug: 'testimonialblock',
      fields: [
        {
          type: 'textarea',
          name: 'testimonial',
        },
        {
          type: 'text',
          name: 'author',
        },
        {
          type: 'text',
          name: 'company',
        },
        {
          type: 'text',
          name: 'avatar',
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
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'publicField',
          type: 'text',
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
        {
          name: 'adminOnlyField',
          type: 'textarea',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'conditionalField',
          type: 'text',
          access: {
            read: ({ req: { user }, siblingData }) => {
              if (isUser(user) && user.roles?.includes('admin')) {
                return true
              }
              return siblingData?.readRole === 'admin'
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
      ],
    },
    // @ts-expect-error - New block types not yet generated for performance testing collections
    // Large collections with heavy block usage for performance testing
    {
      slug: 'articles',
      access: {
        read: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return { status: { equals: 'published' } } as any
          }
          return { status: { equals: 'published' }, isPublic: { equals: true } } as any
        },
        update: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { author: { equals: user?.id } } as any
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        create: ({ req: { user } }) => !!user,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: ['draft', 'published', 'archived'],
          defaultValue: 'draft',
        },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'author',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [],
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'quoteblock',
            'codeblock',
            'calloutblock',
          ] as any,
        },
        {
          name: 'sidebar',
          type: 'blocks',
          blocks: [],
          blockReferences: ['statsblock', 'featureblock', 'testimonialblock'] as any,
        },
      ] as any,
    },
    {
      slug: 'pages',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'sections',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'quoteblock',
            'codeblock',
            'calloutblock',
            'statsblock',
            'featureblock',
            'testimonialblock',
          ] as any,
        },
        {
          name: 'hero',
          type: 'group',
          fields: [
            {
              name: 'headline',
              type: 'text',
            },
            {
              name: 'blocks',
              type: 'blocks',
              blockReferences: ['imageblock', 'videoblock', 'calloutblock'] as any,
            },
          ],
        },
        {
          name: 'footer',
          type: 'group',
          fields: [
            {
              name: 'copyright',
              type: 'text',
            },
            {
              name: 'links',
              type: 'blocks',
              blockReferences: ['titleblock', 'contentblock'] as any,
            },
          ],
        },
      ],
    },
    {
      slug: 'landing-pages',
      access: {
        read: () => true,
        create: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        update: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'sections',
          type: 'array',
          fields: [
            {
              name: 'sectionTitle',
              type: 'text',
            },
            {
              name: 'content',
              type: 'blocks',
              blockReferences: [
                'titleblock',
                'contentblock',
                'imageblock',
                'videoblock',
                'quoteblock',
                'featureblock',
                'testimonialblock',
                'statsblock',
              ],
            },
          ],
        },
        {
          name: 'testimonials',
          type: 'blocks',
          blockReferences: ['testimonialblock', 'quoteblock'] as any,
        },
        {
          name: 'features',
          type: 'blocks',
          blockReferences: ['featureblock', 'statsblock'] as any,
        },
      ],
    },
    {
      slug: 'blog-posts',
      access: {
        read: ({ req: { user } }) => {
          if (isUser(user)) {
            return true
          }
          return { isPublished: { equals: true } }
        },
        update: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { authorId: { equals: user?.id } }
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin')
        },
        create: ({ req: { user } }) => !!user,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
        {
          name: 'authorId',
          type: 'text',
        },
        {
          name: 'isPublished',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'body',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'quoteblock',
            'codeblock',
            'calloutblock',
          ],
        },
        {
          name: 'relatedContent',
          type: 'blocks',
          blockReferences: ['contentblock', 'imageblock', 'quoteblock'] as any,
        },
      ],
    },
    {
      slug: 'products',
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
        },
        {
          name: 'description',
          type: 'blocks',
          blockReferences: ['contentblock', 'imageblock', 'videoblock'] as any,
        },
        {
          name: 'features',
          type: 'blocks',
          blockReferences: ['featureblock', 'statsblock', 'calloutblock'] as any,
        },
        {
          name: 'reviews',
          type: 'blocks',
          blockReferences: ['testimonialblock', 'quoteblock'] as any,
        },
      ],
    },
    {
      slug: 'documentation',
      access: {
        read: () => true,
        create: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        update: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'category',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'codeblock',
            'calloutblock',
          ] as any,
        },
        {
          name: 'examples',
          type: 'array',
          fields: [
            {
              name: 'exampleTitle',
              type: 'text',
            },
            {
              name: 'exampleContent',
              type: 'blocks',
              blockReferences: ['codeblock', 'imageblock', 'contentblock'] as any,
            },
          ],
        },
        {
          name: 'relatedDocs',
          type: 'blocks',
          blockReferences: ['titleblock', 'contentblock'],
        },
      ],
    },
    {
      slug: 'case-studies',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'company',
          type: 'text',
        },
        {
          name: 'overview',
          type: 'blocks',
          blockReferences: ['contentblock', 'statsblock', 'quoteblock'] as any,
        },
        {
          name: 'challenges',
          type: 'blocks',
          blockReferences: ['contentblock', 'calloutblock'] as any,
        },
        {
          name: 'solution',
          type: 'blocks',
          blockReferences: ['contentblock', 'imageblock', 'videoblock', 'featureblock'] as any,
        },
        {
          name: 'results',
          type: 'blocks',
          blockReferences: ['statsblock', 'quoteblock', 'testimonialblock'] as any,
        },
        {
          name: 'testimonial',
          type: 'blocks',
          blockReferences: ['testimonialblock', 'quoteblock'] as any,
        },
      ],
    },
    {
      slug: 'newsletters',
      access: {
        read: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        update: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        create: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
      },
      fields: [
        {
          name: 'subject',
          type: 'text',
          required: true,
        },
        {
          name: 'preheader',
          type: 'text',
        },
        {
          name: 'body',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'calloutblock',
            'featureblock',
          ],
        },
      ],
    },
    {
      slug: 'marketing-campaigns',
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'heroSection',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'calloutblock',
          ],
        },
        {
          name: 'contentSections',
          type: 'array',
          fields: [
            {
              name: 'sectionName',
              type: 'text',
            },
            {
              name: 'blocks',
              type: 'blocks',
              blockReferences: [
                'contentblock',
                'imageblock',
                'videoblock',
                'quoteblock',
                'featureblock',
                'statsblock',
              ],
            },
          ],
        },
        {
          name: 'callToAction',
          type: 'blocks',
          blockReferences: ['calloutblock', 'featureblock'] as any,
        },
        {
          name: 'socialProof',
          type: 'blocks',
          blockReferences: ['testimonialblock', 'statsblock', 'quoteblock'] as any,
        },
      ],
    },
    {
      slug: 'help-articles',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'blocks',
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'codeblock',
            'calloutblock',
          ] as any,
        },
        {
          name: 'faqs',
          type: 'array',
          fields: [
            {
              name: 'question',
              type: 'text',
            },
            {
              name: 'answer',
              type: 'blocks',
              blockReferences: ['contentblock', 'imageblock', 'calloutblock'] as any,
            },
          ],
        },
      ],
    },
    {
      slug: 'portfolio-items',
      access: {
        read: () => true,
        create: ({ req: { user } }) => !!user,
        update: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { ownerId: { equals: user?.id } }
        },
        delete: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { ownerId: { equals: user?.id } }
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'ownerId',
          type: 'text',
        },
        {
          name: 'gallery',
          type: 'blocks',
          blockReferences: ['imageblock', 'videoblock'] as any,
        },
        {
          name: 'details',
          type: 'blocks',
          blockReferences: ['contentblock', 'quoteblock', 'statsblock'] as any,
        },
        {
          name: 'testimonials',
          type: 'blocks',
          blockReferences: ['testimonialblock', 'quoteblock'] as any,
        },
      ],
    },
    // Collections with inline blocks for performance testing
    {
      slug: 'events',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'schedule',
          type: 'blocks',
          blocks: [
            {
              slug: 'session',
              fields: [
                {
                  name: 'sessionTitle',
                  type: 'text',
                },
                {
                  name: 'speaker',
                  type: 'text',
                },
                {
                  name: 'time',
                  type: 'text',
                },
              ],
            },
            {
              slug: 'break',
              fields: [
                {
                  name: 'duration',
                  type: 'number',
                },
                {
                  name: 'type',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'venue',
          type: 'blocks',
          blocks: [
            {
              slug: 'location',
              fields: [
                {
                  name: 'address',
                  type: 'text',
                },
                {
                  name: 'capacity',
                  type: 'number',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'recipes',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'steps',
          type: 'blocks',
          blocks: [
            {
              slug: 'prep-step',
              fields: [
                {
                  name: 'instruction',
                  type: 'textarea',
                },
                {
                  name: 'time',
                  type: 'number',
                },
              ],
            },
            {
              slug: 'cook-step',
              fields: [
                {
                  name: 'instruction',
                  type: 'textarea',
                },
                {
                  name: 'temperature',
                  type: 'number',
                },
                {
                  name: 'duration',
                  type: 'number',
                },
              ],
            },
          ],
        },
        {
          name: 'ingredients',
          type: 'blocks',
          blocks: [
            {
              slug: 'ingredient',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                },
                {
                  name: 'quantity',
                  type: 'text',
                },
                {
                  name: 'unit',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'forms',
      access: {
        read: ({ req: { user } }) => {
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { isPublic: { equals: true } } as any
        },
        update: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        delete: ({ req: { user } }) => {
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        create: ({ req: { user } }) => !!user,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'fields',
          type: 'blocks',
          blocks: [
            {
              slug: 'text-field',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'placeholder',
                  type: 'text',
                },
                {
                  name: 'required',
                  type: 'checkbox',
                },
              ],
            },
            {
              slug: 'select-field',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'options',
                  type: 'text',
                },
                {
                  name: 'multiple',
                  type: 'checkbox',
                },
              ],
            },
            {
              slug: 'checkbox-field',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'defaultChecked',
                  type: 'checkbox',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'workflows',
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'stages',
          type: 'blocks',
          blocks: [
            {
              slug: 'approval-stage',
              fields: [
                {
                  name: 'approver',
                  type: 'text',
                },
                {
                  name: 'timeout',
                  type: 'number',
                },
              ],
            },
            {
              slug: 'action-stage',
              fields: [
                {
                  name: 'actionType',
                  type: 'text',
                },
                {
                  name: 'parameters',
                  type: 'json',
                },
              ],
            },
            {
              slug: 'notification-stage',
              fields: [
                {
                  name: 'recipient',
                  type: 'text',
                },
                {
                  name: 'message',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'surveys',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'questions',
          type: 'blocks',
          blocks: [
            {
              slug: 'multiple-choice',
              fields: [
                {
                  name: 'question',
                  type: 'text',
                },
                {
                  name: 'options',
                  type: 'array',
                  fields: [
                    {
                      name: 'option',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              slug: 'rating',
              fields: [
                {
                  name: 'question',
                  type: 'text',
                },
                {
                  name: 'scale',
                  type: 'number',
                },
              ],
            },
            {
              slug: 'open-ended',
              fields: [
                {
                  name: 'question',
                  type: 'text',
                },
                {
                  name: 'maxLength',
                  type: 'number',
                },
              ],
            },
          ],
        },
      ],
    },
    // Very complex collection for benchmark 5 - stress test
    {
      slug: 'complex-content',
      access: {
        read: async ({ req: { user } }) => {
          // Async access control
          await new Promise((resolve) => setTimeout(resolve, 1))
          if (isUser(user) && user.roles?.includes('admin')) {
            return { status: { in: ['published', 'draft'] } } as any
          }
          return { status: { equals: 'published' }, isPublic: { equals: true } } as any
        },
        update: ({ req: { user } }) => {
          // Sync access control with where
          if (isUser(user) && user.roles?.includes('admin')) {
            return true
          }
          return { author: { equals: user?.id }, status: { equals: 'draft' } } as any
        },
        delete: async ({ req: { user } }) => {
          // Async access control
          await new Promise((resolve) => setTimeout(resolve, 1))
          return isUser(user) && user.roles?.includes('admin') ? true : false
        },
        create: ({ req: { user } }) => !!user,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          access: {
            read: () => true,
            update: async ({ req: { user } }) => {
              await new Promise((resolve) => setTimeout(resolve, 1))
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'status',
          type: 'select',
          options: ['draft', 'published', 'archived', 'pending'],
          defaultValue: 'draft',
        },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'author',
          type: 'text',
          access: {
            read: ({ req: { user } }) => !!user,
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'metadata',
          type: 'group',
          fields: [
            {
              name: 'keywords',
              type: 'text',
              access: {
                read: async ({ req: { user } }) => {
                  await new Promise((resolve) => setTimeout(resolve, 1))
                  return true
                },
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              access: {
                read: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
          ],
        },
        {
          name: 'hero',
          type: 'blocks',
          blocks: [],
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'calloutblock',
          ] as any,
          access: {
            read: () => true,
            update: async ({ req: { user } }) => {
              await new Promise((resolve) => setTimeout(resolve, 1))
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'sections',
          type: 'array',
          fields: [
            {
              name: 'sectionTitle',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => !!user,
              },
            },
            {
              name: 'sectionContent',
              type: 'blocks',
              blocks: [],
              blockReferences: [
                'titleblock',
                'contentblock',
                'imageblock',
                'videoblock',
                'quoteblock',
                'codeblock',
                'calloutblock',
                'statsblock',
                'featureblock',
              ] as any,
            },
            {
              name: 'sectionMetadata',
              type: 'group',
              fields: [
                {
                  name: 'visibility',
                  type: 'select',
                  options: ['public', 'private', 'restricted'],
                  access: {
                    read: async ({ req: { user } }) => {
                      await new Promise((resolve) => setTimeout(resolve, 1))
                      return !!user
                    },
                    update: ({ req: { user } }) => {
                      return isUser(user) && user.roles?.includes('admin')
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'sidebar',
          type: 'blocks',
          blocks: [],
          blockReferences: ['statsblock', 'featureblock', 'testimonialblock', 'quoteblock'] as any,
          access: {
            read: ({ req: { user } }) => !!user,
            update: async ({ req: { user } }) => {
              await new Promise((resolve) => setTimeout(resolve, 1))
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'footer',
          type: 'blocks',
          blocks: [],
          blockReferences: ['contentblock', 'imageblock', 'calloutblock'] as any,
        },
        {
          name: 'relatedContent',
          type: 'array',
          fields: [
            {
              name: 'relatedTitle',
              type: 'text',
            },
            {
              name: 'relatedBlocks',
              type: 'blocks',
              blocks: [],
              blockReferences: ['contentblock', 'imageblock', 'quoteblock', 'videoblock'] as any,
              access: {
                read: () => true,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
          ],
        },
        {
          name: 'tabs',
          type: 'tabs',
          tabs: [
            {
              label: 'Content Tab',
              fields: [
                {
                  name: 'tabContent',
                  type: 'blocks',
                  blocks: [],
                  blockReferences: ['titleblock', 'contentblock', 'imageblock', 'codeblock'] as any,
                  access: {
                    read: () => true,
                    update: async ({ req: { user } }) => {
                      await new Promise((resolve) => setTimeout(resolve, 1))
                      return !!user
                    },
                  },
                },
              ],
            },
            {
              label: 'Settings Tab',
              fields: [
                {
                  name: 'advancedSettings',
                  type: 'group',
                  fields: [
                    {
                      name: 'cache',
                      type: 'checkbox',
                      access: {
                        read: async ({ req: { user } }) => {
                          await new Promise((resolve) => setTimeout(resolve, 1))
                          return isUser(user) && user.roles?.includes('admin')
                        },
                        update: ({ req: { user } }) => {
                          return isUser(user) && user.roles?.includes('admin')
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ] as any,
    },
    // Benchmark 6: Sync-only collection with same where queries and many field access controls
    {
      slug: 'sync-heavy',
      access: {
        // All operations ALWAYS return the SAME where query (sync)
        read: () => {
          return { ownerRole: { equals: 'admin' } } as any
        },
        update: () => {
          return { ownerRole: { equals: 'admin' } } as any
        },
        delete: () => {
          return { ownerRole: { equals: 'admin' } } as any
        },
        create: () => {
          return { ownerRole: { equals: 'admin' } } as any
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          access: {
            read: () => true,
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'ownerRole',
          type: 'text',
          required: true,
        },
        {
          name: 'publicField1',
          type: 'text',
          access: {
            read: () => true,
            update: ({ req: { user } }) => !!user,
          },
        },
        {
          name: 'publicField2',
          type: 'textarea',
          access: {
            read: () => true,
            update: ({ req: { user } }) => !!user,
          },
        },
        {
          name: 'adminField1',
          type: 'text',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'adminField2',
          type: 'textarea',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'adminField3',
          type: 'number',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'userField1',
          type: 'text',
          access: {
            read: ({ req: { user } }) => !!user,
            update: ({ req: { user } }) => !!user,
          },
        },
        {
          name: 'userField2',
          type: 'text',
          access: {
            read: ({ req: { user } }) => !!user,
            update: ({ req: { user } }) => !!user,
          },
        },
        {
          name: 'metadata',
          type: 'group',
          fields: [
            {
              name: 'created',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'modified',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'version',
              type: 'number',
              access: {
                read: ({ req: { user } }) => !!user,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'internalId',
              type: 'text',
              access: {
                read: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
          ],
        },
        {
          name: 'settings',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              access: {
                read: ({ req: { user } }) => !!user,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'priority',
              type: 'number',
              access: {
                read: ({ req: { user } }) => !!user,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
            {
              name: 'tags',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => !!user,
              },
            },
          ],
        },
        {
          name: 'restrictedField1',
          type: 'text',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'restrictedField2',
          type: 'textarea',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'restrictedField3',
          type: 'number',
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'publicData',
          type: 'group',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              access: {
                read: () => true,
                update: ({ req: { user } }) => !!user,
              },
            },
            {
              name: 'summary',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => !!user,
              },
            },
            {
              name: 'category',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
          ],
        },
        {
          name: 'contentBlocks1',
          type: 'blocks',
          blocks: [],
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'videoblock',
            'quoteblock',
          ] as any,
          access: {
            read: () => true,
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'contentBlocks2',
          type: 'blocks',
          blocks: [],
          blockReferences: ['codeblock', 'calloutblock', 'statsblock', 'featureblock'] as any,
          access: {
            read: ({ req: { user } }) => !!user,
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'contentBlocks3',
          type: 'blocks',
          blocks: [],
          blockReferences: ['testimonialblock', 'quoteblock', 'imageblock'] as any,
          access: {
            read: () => true,
            update: ({ req: { user } }) => !!user,
          },
        },
        {
          name: 'adminBlocks',
          type: 'blocks',
          blocks: [],
          blockReferences: [
            'titleblock',
            'contentblock',
            'imageblock',
            'codeblock',
            'calloutblock',
          ] as any,
          access: {
            read: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
            update: ({ req: { user } }) => {
              return isUser(user) && user.roles?.includes('admin')
            },
          },
        },
        {
          name: 'publicBlocks',
          type: 'blocks',
          blocks: [],
          blockReferences: ['titleblock', 'contentblock', 'imageblock', 'videoblock'] as any,
        },
        {
          name: 'nestedContent',
          type: 'array',
          fields: [
            {
              name: 'arrayTitle',
              type: 'text',
              access: {
                read: () => true,
                update: ({ req: { user } }) => !!user,
              },
            },
            {
              name: 'arrayBlocks',
              type: 'blocks',
              blocks: [],
              blockReferences: [
                'contentblock',
                'imageblock',
                'quoteblock',
                'statsblock',
                'featureblock',
              ] as any,
              access: {
                read: () => true,
                update: ({ req: { user } }) => {
                  return isUser(user) && user.roles?.includes('admin')
                },
              },
            },
          ],
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
    console.log('1')
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    console.log('2')

    await payload.create({
      collection: 'users',
      data: {
        email: nonAdminEmail,
        password: 'test',
      },
    })
    console.log('3')

    await payload.create({
      collection: publicUsersSlug,
      data: {
        email: publicUserEmail,
        password: 'test',
      },
    })
    console.log('4')

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
