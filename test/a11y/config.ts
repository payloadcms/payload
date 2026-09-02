import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'a11y',
  config: {
    // ...extend config here
    admin: {
      components: {
        views: {
          FocusIndicatorsView: {
            Component: '/components/FocusIndicatorsView.js#FocusIndicatorsView',
            path: '/focus-indicators',
          },
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [PostsCollection, MediaCollection],
    editor: lexicalEditor({}),
    globals: [
      // ...add more globals here
      MenuGlobal,
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
    })
  },
})
