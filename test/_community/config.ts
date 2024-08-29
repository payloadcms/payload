import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
// import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const docsBasePath = '/Users/alessio/Documents/payloadcms-mdx-mock/docs'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    MediaCollection,
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
    // MediaCollection
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
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

    await payload.delete({
      collection: 'posts',
      where: {},
    })

    // Recursively collect all paths to .mdx files RELATIVE to basePath
    const walkSync = (dir: string, filelist: string[] = []) => {
      fs.readdirSync(dir).forEach((file) => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
          ? walkSync(path.join(dir, file), filelist)
          : filelist.concat(path.join(dir, file))
      })
      return filelist
    }

    const mdxFiles = walkSync(docsBasePath)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(docsBasePath, ''))

    for (const file of mdxFiles) {
      await payload.create({
        collection: 'posts',
        depth: 0,
        context: {
          seed: true,
        },
        data: {
          docPath: file,
        },
      })
    }

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
