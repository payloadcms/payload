import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { fileURLToPath } from 'node:url'
import path from 'path'
import sharp from 'sharp'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { generateBlockFields, generateBlocks } from './blocks/blocks.js'
import { MediaCollection, mediaSharpOptions, mediaSlug } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const USE_BLOCK_REFERENCES = true

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      PostsCollection,
      {
        slug: 'pages',
        access: {
          create: () => true,
          read: () => true,
        },
        fields: generateBlockFields(40, 30 * 20, USE_BLOCK_REFERENCES),
        versions: false,
      },
      MediaCollection,
    ],
    editor: lexicalEditor({}),
    upload: {
      transformers: [sharpTransformer({ collections: { [mediaSlug]: mediaSharpOptions }, sharp })],
    },
    // @ts-expect-error -- The benchmark intentionally produces more block types than generated types include.
    blocks: USE_BLOCK_REFERENCES ? generateBlocks(30 * 20, false) : undefined,
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
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
      overrideAccess: true,
    })
  },
  suite: 'benchmark-blocks',
})
