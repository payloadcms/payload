import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: false,
  },
  localization: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
  },
  globals: [],
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
                  name: 'title',
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
      ],
    },
  ],
  onInit: async (payload) => {
    // await payload.create({
    //   collection: 'users',
    //   data: {
    //     email: devUser.email,
    //     password: devUser.password,
    //   },
    // })
  },
})
