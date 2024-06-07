import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export const slug = 'global'
export const arraySlug = 'array'

export const accessControlSlug = 'access-control'

export const defaultValueSlug = 'default-value'

export const englishLocale = 'en'
export const spanishLocale = 'es'

export const globalsEndpoint = 'hello-world'

const access = {
  read: () => true,
  update: () => true,
}

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'media',
      upload: true,
      fields: [],
    },
  ],
  globals: [
    {
      access,
      fields: [
        {
          name: 'json',
          type: 'json',
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
        },
      ],
      slug,
    },
    {
      access,
      fields: [
        {
          name: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
          localized: true,
          type: 'array',
        },
      ],
      slug: arraySlug,
    },
    {
      fields: [
        {
          name: 'text',
          defaultValue: 'test',
          type: 'text',
        },
        {
          name: 'group',
          fields: [
            {
              name: 'text',
              defaultValue: 'test',
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
      slug: defaultValueSlug,
    },
    {
      access: {
        read: ({ req: { user } }) => {
          if (user) {
            return true
          }

          return {
            enabled: {
              equals: true,
            },
          }
        },
      },
      fields: [
        {
          name: 'title',
          required: true,
          type: 'text',
        },
        {
          name: 'enabled',
          type: 'checkbox',
        },
      ],
      slug: accessControlSlug,
    },
    {
      access,
      fields: [],
      graphQL: false,
      slug: 'without-graphql',
    },
  ],
  localization: {
    defaultLocale: englishLocale,
    locales: [englishLocale, spanishLocale],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.updateGlobal({
      data: {
        title: 'hello',
      },
      slug: accessControlSlug,
    })
  },
})
