import path from 'path'

import type { CollectionConfig } from '../../packages/payload/src/collections/config/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

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
    access: openAccess,
    fields: [
      {
        name: 'name',
        type: 'text',
      },
    ],
    slug: collectionSlug,
  }
}

export const slug = 'posts'
export const relationSlug = 'relation'

export const pointSlug = 'point'

export const errorOnHookSlug = 'error-on-hooks'

export default buildConfigWithDefaults({
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  collections: [
    {
      access: openAccess,
      auth: true,
      fields: [],
      slug: 'users',
    },
    {
      access: openAccess,
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
      slug: pointSlug,
    },
    {
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
          min: 10,
          type: 'number',
        },
        // Relationship
        {
          name: 'relationField',
          relationTo: relationSlug,
          type: 'relationship',
        },
        {
          name: 'relationToCustomID',
          relationTo: 'custom-ids',
          type: 'relationship',
        },
        // Relation hasMany
        {
          name: 'relationHasManyField',
          hasMany: true,
          relationTo: relationSlug,
          type: 'relationship',
        },
        // Relation multiple relationTo
        {
          name: 'relationMultiRelationTo',
          relationTo: [relationSlug, 'dummy'],
          type: 'relationship',
        },
        // Relation multiple relationTo hasMany
        {
          name: 'relationMultiRelationToHasMany',
          hasMany: true,
          relationTo: [relationSlug, 'dummy'],
          type: 'relationship',
        },
        {
          name: 'A1',
          fields: [
            {
              name: 'A2',
              defaultValue: 'textInRowInGroup',
              type: 'text',
            },
          ],
          type: 'group',
        },
        {
          name: 'B1',
          fields: [
            {
              fields: [
                {
                  name: 'B2',
                  defaultValue: 'textInRowInGroup',
                  type: 'text',
                },
              ],
              label: 'Collapsible',
              type: 'collapsible',
            },
          ],
          type: 'group',
        },
        {
          name: 'C1',
          fields: [
            {
              name: 'C2Text',
              type: 'text',
            },
            {
              fields: [
                {
                  fields: [
                    {
                      name: 'C2',
                      fields: [
                        {
                          fields: [
                            {
                              fields: [
                                {
                                  name: 'C3',
                                  type: 'text',
                                },
                              ],
                              label: 'Collapsible2',
                              type: 'collapsible',
                            },
                          ],
                          type: 'row',
                        },
                      ],
                      type: 'group',
                    },
                  ],
                  label: 'Collapsible2',
                  type: 'collapsible',
                },
              ],
              type: 'row',
            },
          ],
          type: 'group',
        },
        {
          tabs: [
            {
              name: 'D1',
              fields: [
                {
                  name: 'D2',
                  fields: [
                    {
                      fields: [
                        {
                          fields: [
                            {
                              tabs: [
                                {
                                  fields: [
                                    {
                                      name: 'D3',
                                      fields: [
                                        {
                                          fields: [
                                            {
                                              fields: [
                                                {
                                                  name: 'D4',
                                                  type: 'text',
                                                },
                                              ],
                                              label: 'Collapsible2',
                                              type: 'collapsible',
                                            },
                                          ],
                                          type: 'row',
                                        },
                                      ],
                                      type: 'group',
                                    },
                                  ],
                                  label: 'Tab1',
                                },
                              ],
                              type: 'tabs',
                            },
                          ],
                          label: 'Collapsible2',
                          type: 'collapsible',
                        },
                      ],
                      type: 'row',
                    },
                  ],
                  type: 'group',
                },
              ],
              label: 'Tab1',
            },
          ],
          type: 'tabs',
        },
      ],
      slug,
    },
    {
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
      slug: 'custom-ids',
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
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'payloadAPI',
          hooks: {
            afterRead: [({ req }) => req.payloadAPI],
          },
          type: 'text',
        },
      ],
      slug: 'payload-api-test-ones',
    },
    {
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'payloadAPI',
          hooks: {
            afterRead: [({ req }) => req.payloadAPI],
          },
          type: 'text',
        },
        {
          name: 'relation',
          relationTo: 'payload-api-test-ones',
          type: 'relationship',
        },
      ],
      slug: 'payload-api-test-twos',
    },
    {
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'contentType',
          hooks: {
            afterRead: [({ req }) => req.headers?.['content-type']],
          },
          type: 'text',
        },
      ],
      slug: 'content-type',
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
          name: 'relationToSelfPoly',
          type: 'relationship',
          relationTo: ['cyclical-relationship'],
        },
        {
          type: 'upload',
          name: 'media',
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
      upload: true,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: 'global-1',
      access: {
        read: openAccess.read,
        update: openAccess.update,
      },
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'cyclical-relationship',
        },
      ],
      versions: {
        drafts: true,
      },
    },
  ],
  graphQL: {
    queries: (GraphQL) => {
      return {
        QueryWithInternalError: {
          resolve: () => {
            // Throwing an internal error with potentially sensitive data
            throw new Error('Lost connection to the Pentagon. Secret data: ******')
          },
          type: new GraphQL.GraphQLObjectType({
            name: 'QueryWithInternalError',
            fields: {
              text: {
                type: GraphQL.GraphQLString,
              },
            },
          }),
        },
      }
    },
    schemaOutputFile: path.resolve(__dirname, 'schema.graphql'),
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

    await payload.create({
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
})
