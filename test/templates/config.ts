import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Articles } from './collections/Articles.js'
import { HookedCollection } from './collections/HookedCollection.js'
import { Pages } from './collections/Pages.js'
import { SimpleNoTemplates } from './collections/SimpleNoTemplates.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [Articles, Pages, SimpleNoTemplates, HookedCollection],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
    const existingUsers = await payload.find({ collection: 'users', limit: 1 })
    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    }

    const existingArticles = await payload.find({
      collection: 'articles',
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    if (existingArticles.docs.length === 0) {
      await payload.create({
        collection: 'articles',
        data: {
          title: 'Seed Article',
          slug: 'seed-article',
          excerpt: 'A seed article for e2e tests.',
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
