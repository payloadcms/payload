import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
// import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    PostsCollection,
    {
      slug: 'tests',
      fields: [
        {
          name: 'default',
          type: 'text',
          defaultValue: 'some default',
        },
        {
          name: 'real',
          type: 'number',
          dbType: 'real',
        },
        {
          name: 'virtualField',
          type: 'text',
          dbStore: false,
          hooks: {
            afterRead: [() => 'Virtual'],
            beforeChange: [
              (args) => {
                delete args.siblingData['virtualField']
              },
            ],
          },
        },
        {
          name: 'select',
          type: 'select',
          options: ['some', 'asd'],
          defaultValue: 'some',
        },
        {
          name: 'blocks',
          type: 'blocks',
          dbJsonColumn: true,
          blocks: [{ slug: 'some', fields: [{ type: 'text', name: 'text' }] }],
        },
        {
          name: 'arr',
          type: 'array',
          dbJsonColumn: true,
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
    // MediaCollection
  ],
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  globals: [
    MenuGlobal,
    // ...add more globals here
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
        text: 'example post',
      },
    })

    // // Create image
    // const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    // const imageFile = await getFileByPath(imageFilePath)

    // await payload.create({
    //   collection: 'media',
    //   data: {},
    //   file: imageFile,
    // })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
