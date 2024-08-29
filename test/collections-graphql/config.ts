import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { CollectionConfig } from 'payload'

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

export const slug = 'posts'
export const relationSlug = 'relation'

export const pointSlug = 'point'

export const errorOnHookSlug = 'error-on-hooks'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'users',
      access: openAccess,
      auth: true,
      fields: [],
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
    {
      slug,
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
          name: 'min',
          type: 'number',
          min: 10,
        },
        // Relationship
        {
          name: 'relationField',
          type: 'relationship',
          relationTo: relationSlug,
        },
        {
          name: 'relationToCustomID',
          type: 'relationship',
          relationTo: 'custom-ids',
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
          name: 'A1',
          type: 'group',
          fields: [
            {
              name: 'A2',
              type: 'text',
              defaultValue: 'textInRowInGroup',
            },
          ],
        },
        {
          name: 'B1',
          type: 'group',
          fields: [
            {
              type: 'collapsible',
              fields: [
                {
                  name: 'B2',
                  type: 'text',
                  defaultValue: 'textInRowInGroup',
                },
              ],
              label: 'Collapsible',
            },
          ],
        },
        {
          name: 'C1',
          type: 'group',
          fields: [
            {
              name: 'C2Text',
              type: 'text',
            },
            {
              type: 'row',
              fields: [
                {
                  type: 'collapsible',
                  fields: [
                    {
                      name: 'C2',
                      type: 'group',
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            {
                              type: 'collapsible',
                              fields: [
                                {
                                  name: 'C3',
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
                  label: 'Collapsible2',
                },
              ],
            },
          ],
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
      slug: 'custom-ids',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'id',
          type: 'number',
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    collectionWithName(relationSlug),
    collectionWithName('dummy'),
    {
      ...collectionWithName(errorOnHookSlug),
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'errorBeforeChange',
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
      slug: 'payload-api-test-ones',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'payloadAPI',
          type: 'text',
          hooks: {
            afterRead: [({ req }) => req.payloadAPI],
          },
        },
      ],
    },
    {
      slug: 'payload-api-test-twos',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'payloadAPI',
          type: 'text',
          hooks: {
            afterRead: [({ req }) => req.payloadAPI],
          },
        },
        {
          name: 'relation',
          type: 'relationship',
          relationTo: 'payload-api-test-ones',
        },
      ],
    },
    {
      slug: 'content-type',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'contentType',
          type: 'text',
          hooks: {
            afterRead: [({ req }) => req.headers?.get('content-type')],
          },
        },
      ],
    },
    {
      slug: 'cyclical-relationship',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'relationToSelf',
          type: 'relationship',
          relationTo: 'cyclical-relationship',
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
        },
      ],
      versions: {
        drafts: true,
      },
    },
    {
      slug: 'media',
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      upload: true,
    },
  ],
  graphQL: {
    queries: (GraphQL) => {
      return {
        QueryWithInternalError: {
          type: new GraphQL.GraphQLObjectType({
            name: 'QueryWithInternalError',
            fields: {
              text: {
                type: GraphQL.GraphQLString,
              },
            },
          }),
          resolve: () => {
            // Throwing an internal error with potentially sensitive data
            throw new Error('Lost connection to the Pentagon. Secret data: ******')
          },
        },
      }
    },
  },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: 'custom-ids',
      data: {
        id: 1,
        title: 'hello',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        relationToCustomID: 1,
        title: 'has custom ID relation',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        title: 'post1',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        title: 'post2',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        description: 'description',
        title: 'with-description',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        number: 1,
        title: 'numPost1',
      },
    })
    await payload.create({
      collection: slug,
      data: {
        number: 2,
        title: 'numPost2',
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

    // Relation - hasMany
    await payload.create({
      collection: slug,
      data: {
        relationHasManyField: rel1.id,
        title: 'rel to hasMany',
      },
    })
    await payload.create({
      collection: slug,
      data: {
        relationHasManyField: rel2.id,
        title: 'rel to hasMany 2',
      },
    })

    // Relation - relationTo multi
    await payload.create({
      collection: slug,
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
      collection: slug,
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

    const payloadAPITest1 = await payload.create({
      collection: 'payload-api-test-ones',
      data: {},
    })

    const t = await payload.create({
      collection: 'payload-api-test-twos',
      data: {
        relation: payloadAPITest1.id,
      },
    })

    await payload.create({
      collection: pointSlug,
      data: {
        point: [10, 20],
      },
    })

    await payload.create({
      collection: 'content-type',
      data: {},
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
