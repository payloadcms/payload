import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { getFileByPath } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection, mediaSharpOptions, mediaSlug } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'email',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [PostsCollection, MediaCollection],
    email: nodemailerAdapter(),
    globals: [MenuGlobal],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [sharpTransformer({ collections: { [mediaSlug]: mediaSharpOptions }, sharp })],
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
        text: 'example post',
      },
      overrideAccess: true,
    })

    const email = await payload.sendEmail({
      subject: 'This was sent on init',
      to: 'test@example.com',
    })

    // Create image
    const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    await payload.create({
      collection: 'media',
      data: {},
      file: imageFile,
      overrideAccess: true,
    })
  },
})
