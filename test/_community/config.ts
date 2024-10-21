import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
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
  // ...extend config here
  collections: [
    PostsCollection,
    {
      slug: 'simple',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    MediaCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    avatar: {
      Component: '/collections/Posts/MyAvatar.js#MyAvatar',
    },
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      BlocksFeature({
        blocks: [
          {
            admin: {
              components: {
                Label: '/collections/Posts/MyComponent2.js#MyComponent2',
              },
            },
            slug: 'test',
            fields: [
              {
                name: 'test',
                type: 'text',
              },
            ],
          },
          {
            slug: 'someBlock2',
            fields: [
              {
                name: 'test2',
                type: 'text',
              },
            ],
          },
        ],
        inlineBlocks: [
          {
            admin: {
              components: {
                Label: '/collections/Posts/MyComponent2.js#MyComponent2',
              },
            },
            slug: 'test',
            fields: [
              {
                name: 'test',
                type: 'text',
              },
            ],
          },
          {
            slug: 'someBlock2',
            fields: [
              {
                name: 'test2',
                type: 'text',
              },
            ],
          },
        ],
      }),
    ],
  }),
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  globals: [
    MenuGlobal,
    {
      slug: 'custom-ts',
      fields: [
        {
          name: 'custom',
          type: 'text',
          typescriptSchema: [
            () => ({
              enum: ['hello', 'world'],
            }),
          ],
        },
        {
          name: 'withDefinitionsUsage',
          type: 'text',
          typescriptSchema: [
            () => ({
              type: 'array',
              items: {
                $ref: `#/definitions/objectWithNumber`,
              },
            }),
          ],
        },
        {
          name: 'json',
          type: 'json',
          jsonSchema: {
            fileMatch: ['a://b/foo.json'],
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  age: {
                    type: 'integer',
                  },
                  // Add other properties here
                },
                required: ['id', 'name'], // Specify which properties are required
              },
            },
            uri: 'a://b/foo.json',
          },
          required: true,
        },
      ],
    },
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
    schema: [
      ({ jsonSchema }) => {
        jsonSchema.definitions.objectWithNumber = {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: {
              type: 'number',
              required: true,
            },
          },
          required: true,
        }
        return jsonSchema
      },
    ],
  },
})
