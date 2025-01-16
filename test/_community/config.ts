import type { Block, BlocksField } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
import { testBlocks } from './testBlocks.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const blocks: BlocksField = {
  blocks: testBlocks,
  type: 'blocks',
  name: 'blocks',
}
export default buildConfigWithDefaults({
  // ...extend config here
  collections: [PostsCollection, MediaCollection, { slug: 'blocks-collection', fields: [blocks] }],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
    {
      slug: 'blocks-global',
      fields: [blocks],
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
