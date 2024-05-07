import path from 'path'
import { getFileByPath } from 'payload/uploads'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    {
      slug: 'categories',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    PostsCollection,
    MediaCollection,
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'es',
        label: 'Spanish',
      },
    ],
  },
  // globals: [
  //   MenuGlobal,
  //   // ...add more globals here
  // ],
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create image
    const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const media = await payload.create({
      collection: 'media',
      data: {},
      file: imageFile,
    })

    const post = await payload.create({
      collection: postsSlug,
      data: {
        associatedMedia: media.id,
        text: 'example post',
      },
    })
    // console.log(post.associatedMedia.id)
  },
})
