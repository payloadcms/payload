import nestedDocs from '../../packages/plugin-nested-docs/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Categories } from './collections/Categories'
import { Pages } from './collections/Pages'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { seed } from './seed'

export default buildConfigWithDefaults({
  collections: [Pages, Categories, Tags, Users],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [
    nestedDocs({
      collections: ['pages'],
      generateLabel: (_, doc) => doc.title as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
    nestedDocs({
      breadcrumbsFieldSlug: 'categorization',
      collections: ['categories'],
      generateLabel: (_, doc) => doc.name as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.name}`, ''),
      parentFieldSlug: 'owner',
    }),
    nestedDocs({
      collections: ['tags'],
      generateLabel: (_, doc) => doc.tagName as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.uri}`, ''),
      urlFieldSlug: 'uri',
    }),
  ],
})
