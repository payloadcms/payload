import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { APIError, type CollectionConfig, type Endpoint } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export interface Relation {
  id: string
  name: string
}

const openAccess = {
  create: () => true,
  delete: () => true,
  read: () => true,
  update: () => true,
}

export const methods: Endpoint['method'][] = ['get', 'delete', 'patch', 'post', 'put']

const collectionWithName = (collectionSlug: string): CollectionConfig => {
  return {
    slug: collectionSlug,
    access: openAccess,
    fields: [
      {
        name: 'name',
        type: 'text',
      },
    ],
  }
}

export const postsSlug = 'posts'
export const relationSlug = 'relation'
export const pointSlug = 'point'
export const customIdSlug = 'custom-id'
export const customIdNumberSlug = 'custom-id-number'
export const errorOnHookSlug = 'error-on-hooks'

export const endpointsSlug = 'endpoints'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: postsSlug,
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        {
          name: 'fakeLocalization',
          type: 'text',
          // field is localized even though the config localization is not on
          localized: true,
        },
        // Relationship
        {
          name: 'relationField',
          type: 'relationship',
          relationTo: relationSlug,
        },
        // Relation hasMany
        {
          name: 'relationHasManyField',
          type: 'relationship',
          hasMany: true,
          relationTo: relationSlug,
        },
        // Relation multiple relationTo
        {
          name: 'relationMultiRelationTo',
          type: 'relationship',
          relationTo: [relationSlug, 'dummy'],
        },
        // Relation multiple relationTo hasMany
        {
          name: 'relationMultiRelationToHasMany',
          type: 'relationship',
          hasMany: true,
          relationTo: [relationSlug, 'dummy'],
        },
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: () => false,
          },
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'D1',
              fields: [
                {
                  name: 'D2',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          type: 'collapsible',
                          fields: [
                            {
                              type: 'tabs',
                              tabs: [
                                {
                                  fields: [
                                    {
                                      name: 'D3',
                                      type: 'group',
                                      fields: [
                                        {
                                          type: 'row',
                                          fields: [
                                            {
                                              type: 'collapsible',
                                              fields: [
                                                {
                                                  name: 'D4',
                                                  type: 'text',
                                                },
                                              ],
                                              label: 'Collapsible2',
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                  label: 'Tab1',
                                },
                              ],
                            },
                          ],
                          label: 'Collapsible2',
                        },
                      ],
                    },
                  ],
                },
              ],
              label: 'Tab1',
            },
          ],
        },
      ],
    },
    {
      slug: pointSlug,
      access: openAccess,
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
    collectionWithName(relationSlug),
    {
      slug: 'dummy',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
    },
    {
      slug: customIdSlug,
      access: openAccess,
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: customIdNumberSlug,
      access: openAccess,
      fields: [
        {
          name: 'id',
          type: 'number',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: errorOnHookSlug,
      access: openAccess,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'errorBeforeChange',
          type: 'checkbox',
        },
        {
          name: 'errorAfterDelete',
          type: 'checkbox',
        },
      ],
      hooks: {
        afterDelete: [
          ({ doc }) => {
            if (doc?.errorAfterDelete) {
              throw new Error('Error After Delete Thrown')
            }
          },
        ],
        beforeChange: [
          ({ originalDoc }) => {
            if (originalDoc?.errorBeforeChange) {
              throw new Error('Error Before Change Thrown')
            }
          },
        ],
      },
    },
    {
      slug: endpointsSlug,
      fields: [],
      endpoints: methods.map((method) => ({
        method,
        handler: () => new Response(`${method} response`),
        path: `/${method}-test`,
      })),
    },
  ],
  endpoints: [
    {
      handler: async ({ payload }) => {
        await payload.sendEmail({
          from: 'dev@payloadcms.com',
          html: 'This is a test email.',
          subject: 'Test Email',
          to: devUser.email,
          // to recreate a failing email transport, add the following credentials
          // to the `email` property of `payload.init()` in `../dev.ts`
          // the app should fail to send the email, but the error should be handled without crashing the app
          // transportOptions: {
          //   host: 'smtp.ethereal.email',
          //   port: 587,
          // },
        })

        return Response.json({ message: 'Email sent' })
      },
      method: 'get',
      path: '/send-test-email',
    },
    {
      handler: () => {
        // Throwing an internal error with potentially sensitive data
        throw new Error('Lost connection to the Pentagon. Secret data: ******')
      },
      method: 'get',
      path: '/internal-error-here',
    },
    {
      handler: () => {
        // Throwing an internal error with potentially sensitive data
        throw new APIError('Connected to the Pentagon. Secret data: ******')
      },
      method: 'get',
      path: '/api-error-here',
    },
    ...methods.map((method) => ({
      method,
      handler: () => new Response(`${method} response`),
      path: `/${method}-test`,
    })),
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const rel1 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'name',
      },
    })
    const rel2 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'name2',
      },
    })

    await payload.create({
      collection: pointSlug,
      data: {
        point: [10, 20],
      },
    })

    // Relation - hasMany
    await payload.create({
      collection: postsSlug,
      data: {
        relationHasManyField: rel1.id,
        title: 'rel to hasMany',
      },
    })
    await payload.create({
      collection: postsSlug,
      data: {
        relationHasManyField: rel2.id,
        title: 'rel to hasMany 2',
      },
    })

    // Relation - relationTo multi
    await payload.create({
      collection: postsSlug,
      data: {
        relationMultiRelationTo: {
          relationTo: relationSlug,
          value: rel2.id,
        },
        title: 'rel to multi',
      },
    })

    // Relation - relationTo multi hasMany
    await payload.create({
      collection: postsSlug,
      data: {
        relationMultiRelationToHasMany: [
          {
            relationTo: relationSlug,
            value: rel1.id,
          },
          {
            relationTo: relationSlug,
            value: rel2.id,
          },
        ],
        title: 'rel to multi hasMany',
      },
    })

    await payload.create({
      collection: customIdSlug,
      data: {
        id: 'test',
        name: 'inside row',
      },
    })

    await payload.create({
      collection: customIdNumberSlug,
      data: {
        id: 123,
        name: 'name',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
