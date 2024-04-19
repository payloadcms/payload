import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'pages',
      access: {
        read: () => true,
        create: () => true,
        delete: () => true,
        update: () => true,
      },
      endpoints: [
        {
          path: '/hello',
          method: 'get',
          handler: () => {
            return Response.json({ message: 'hi' })
          },
          custom: { examples: [{ type: 'response', value: { message: 'hi' } }] },
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: {
            client: { description: 'The title of this page' },
            server: { description: 'The title of this page' },
          },
        },
        {
          name: 'myBlocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'blockOne',
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
              custom: {
                client: { description: 'The blockOne of this page' },
                server: { description: 'The blockOne of this page' },
              },
            },
          ],
          custom: {
            client: { description: 'The blocks of this page' },
            server: { description: 'The blocks of this page' },
          },
        },
      ],
      custom: {
        client: { externalLink: 'https://foo.bar' },
        server: { externalLink: 'https://foo.bar' },
      },
    },
  ],
  globals: [
    {
      slug: 'my-global',
      endpoints: [
        {
          path: '/greet',
          method: 'get',
          handler: (req) => {
            const sp = new URL(req.url).searchParams
            return Response.json({ message: `Hi ${sp.get('name')}!` })
          },
          custom: { params: [{ in: 'query', name: 'name', type: 'string' }] },
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: {
            client: { description: 'The title of my global' },
            server: { description: 'The title of my global' },
          },
        },
      ],
      custom: { client: { foo: 'bar' }, server: { foo: 'bar' } },
    },
  ],
  endpoints: [
    {
      path: '/config',
      method: 'get',
      handler: (req) => {
        return Response.json(req.payload.config)
      },
      custom: { description: 'Get the sanitized payload config' },
    },
  ],
  custom: { client: { name: 'Customer portal' }, server: { name: 'Customer portal' } },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
