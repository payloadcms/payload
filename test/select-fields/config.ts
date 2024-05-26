import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: { email: devUser.email, password: devUser.password },
  },

  localization: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
  },
  globals: [
    {
      slug: 'someGlobal',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'relFirst',
          type: 'relationship',
          relationTo: 'relationships-items',
        },
        {
          name: 'relSecond',
          type: 'relationship',
          relationTo: 'relationships-items',
        },
      ],
    },
  ],
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'categories',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts',
      access: {
        read: () => true,
      },
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'groupMultiple',
          fields: [
            {
              name: 'titleFirst',
              type: 'text',
            },
            {
              name: 'titleSecond',
              type: 'text',
            },
          ],
        },
        {
          type: 'array',
          name: 'arrayMultiple',
          fields: [
            {
              name: 'titleFirst',
              type: 'text',
            },
            {
              name: 'titleSecond',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'groupArray',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'section',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'secondTitle',
                  type: 'text',
                },
              ],
            },
            {
              slug: 'cta',
              fields: [
                {
                  type: 'text',
                  name: 'cta',
                },
              ],
            },
          ],
        },
        {
          type: 'select',
          hasMany: true,
          name: 'select',
          options: ['hello', 'world'],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'tab',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'label',
                  type: 'text',
                },
              ],
            },
          ],
        },
        // {
        //   type: 'relationship',
        //   relationTo: 'categories',
        //   name: 'category',
        // },
      ],
    },
    {
      slug: 'deep-nested',
      fields: [
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'group',
              type: 'group',
              fields: [
                {
                  type: 'array',
                  name: 'array',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'first',
              fields: [
                {
                  name: 'array',
                  type: 'array',
                  fields: [
                    {
                      name: 'group',
                      type: 'group',
                      fields: [
                        {
                          name: 'title',
                          type: 'text',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              slug: 'second',
              fields: [
                {
                  name: 'group',
                  type: 'group',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'localized-posts',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'arrayLocalized',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              localized: true,
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          name: 'blocks',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'some',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
        // {
        //   name: 'groupLocalized',
        //   type: 'group',
        //   localized: true,
        //   fields: [
        //     {
        //       name: 'title',
        //       type: 'text',
        //     },
        //   ],
        // },
        // {
        //   name: 'group',
        //   type: 'group',
        //   fields: [
        //     {
        //       localized: true,
        //       name: 'title',
        //       type: 'text',
        //     },
        //   ],
        // },
      ],
    },

    {
      slug: 'relationships-items-nested',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'subtitle',
          type: 'text',
        },
      ],
    },
    {
      slug: 'relationships-items',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          type: 'relationship',
          name: 'nested',
          relationTo: 'relationships-items-nested',
        },
      ],
    },
    {
      slug: 'relationships',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: 'relationships-items',
        },
        {
          name: 'other',
          type: 'relationship',
          relationTo: 'relationships-items',
        },
        {
          name: 'withDefaultPopulate',
          type: 'relationship',
          relationTo: 'relationships-items',
          defaultPopulate: {
            select: ['title'],
          },
        },
        {
          name: 'polymorphic',
          type: 'relationship',
          relationTo: ['relationships-items', 'relationships-items-nested'],
        },
        {
          name: 'polymorphicDefault',
          type: 'relationship',
          defaultPopulate: [
            {
              relationTo: 'relationships-items',
              value: {
                select: ['title'],
              },
            },
          ],
          relationTo: ['relationships-items', 'relationships-items-nested'],
        },
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'item',
              type: 'relationship',
              relationTo: 'relationships-items',
            },
          ],
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
  },
})
