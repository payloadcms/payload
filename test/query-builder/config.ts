import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { CategoriesCollection, categoriesSlug } from './collections/Categories/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [PostsCollection, CategoriesCollection, MediaCollection],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const [category1, category2] = await Promise.all([
      payload.create({
        collection: categoriesSlug,
        data: {
          title: 'Category 1',
        },
      }),
      payload.create({
        collection: categoriesSlug,
        data: {
          title: 'Category 2',
        },
      }),
    ])

    await Promise.all(
      Array.from({ length: 10 }).map(async (_, index) =>
        payload.create({
          collection: postsSlug,
          data: {
            title: `Post ${index + 1}`,
            category: index < 5 ? category1.id : category2.id,
          },
        }),
      ),
    )
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
