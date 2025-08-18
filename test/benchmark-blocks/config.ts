import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { generateBlockFields, generateBlocks } from './blocks/blocks.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const USE_BLOCK_REFERENCES = true

export default buildConfigWithDefaults({
  collections: [
    PostsCollection,
    {
      slug: 'pages',
      access: {
        create: () => true,
        read: () => true,
      },
      fields: generateBlockFields(40, 30 * 20, USE_BLOCK_REFERENCES),
    },
    MediaCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  // @ts-expect-error
  blocks: USE_BLOCK_REFERENCES ? generateBlocks(30 * 20, false) : undefined,
  onInit: async (payload) => {
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
