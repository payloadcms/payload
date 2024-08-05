import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'blocks-collection',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'content',
              fields: [
                {
                  name: 'richText',
                  type: 'richText',
                },
                {
                  name: 'field1',
                  type: 'text',
                },
                {
                  name: 'field2',
                  type: 'text',
                },
                {
                  name: 'field3',
                  type: 'text',
                },
                {
                  name: 'field4',
                  type: 'text',
                },
                {
                  name: 'field5',
                  type: 'text',
                },
                {
                  name: 'field6',
                  type: 'text',
                },
                {
                  name: 'field7',
                  type: 'text',
                },
                {
                  name: 'field8',
                  type: 'text',
                },
                {
                  name: 'field9',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
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
      collection: 'blocks-collection',
      data: {
        layout: [...Array(100)].map((row, i) => ({
          blockName: `Block ${i}`,
          blockType: 'content',
          richText: [
            {
              children: [{ text: '' }],
            },
          ],
          field1: 'text field 1',
          field2: 'text field 2',
          field3: 'text field 3',
          field4: 'text field 4',
          field5: 'text field 5',
          field6: 'text field 6',
          field7: 'text field 7',
          field8: 'text field 8',
          field9: 'text field 9',
        })),
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
