import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { fileURLToPath } from 'node:url'
import path from 'path'
import sharp from 'sharp'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection, mediaSharpOptions, mediaSlug } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'admin-bar',
  config: {
    upload: {
      transformers: [sharpTransformer({ collections: { [mediaSlug]: mediaSharpOptions }, sharp })],
    },
    // ...extend config here
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [PostsCollection, MediaCollection],
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
})
