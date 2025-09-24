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
      slug: 'pages',
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      custom: {
        externalLink: 'https://foo.bar',
      },
      endpoints: [
        {
          custom: { examples: [{ type: 'response', value: { message: 'hi' } }] },
          handler: () => {
            return Response.json({ message: 'hi' })
          },
          method: 'get',
          path: '/hello',
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: {
            description: 'The title of this page',
          },
        },
        {
          name: 'myBlocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'blockOne',
              custom: {
                description: 'The blockOne of this page',
              },
              fields: [
                {
                  name: 'blockOneField',
                  type: 'text',
                },
                {
                  name: 'blockTwoField',
                  type: 'text',
                },
              ],
            },
          ],
          custom: {
            description: 'The blocks of this page',
          },
        },
      ],
    },
  ],
  custom: { name: 'Customer portal' },
  endpoints: [
    {
      custom: { description: 'Get the sanitized payload config' },
      handler: (req) => {
        return Response.json(req.payload.config)
      },
      method: 'get',
      path: '/config',
    },
  ],
  bin: [
    {
      scriptPath: path.resolve(dirname, 'customScript.ts'),
      key: 'start-server',
    },
  ],
  globals: [
    {
      slug: 'my-global',
      custom: { foo: 'bar' },
      endpoints: [
        {
          custom: { params: [{ name: 'name', type: 'string', in: 'query' }] },
          handler: (req) => {
            const sp = new URL(req.url).searchParams
            return Response.json({ message: `Hi ${sp.get('name')}!` })
          },
          method: 'get',
          path: '/greet',
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: {
            description: 'The title of my global',
          },
        },
      ],
    },
  ],
  onInit: async (payload) => {
    const { totalDocs } = await payload.count({ collection: 'users' })

    if (totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: {
    origins: '*',
    headers: ['x-custom-header'],
  },
})
