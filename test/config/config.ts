import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

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
          custom: { description: 'The title of this page' },
        },
      ],
      custom: { externalLink: 'https://foo.bar' },
    },
  ],
  globals: [
    {
      slug: 'my-global',
      endpoints: [
        {
          path: '/greet',
          method: 'get',
          handler: ({ req }) => {
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
          custom: { description: 'The title of my global' },
        },
      ],
      custom: { foo: 'bar' },
    },
  ],
  endpoints: [
    {
      path: '/config',
      method: 'get',
      root: true,
      handler: ({ req }) => {
        return Response.json(req.payload.config)
      },
      custom: { description: 'Get the sanitized payload config' },
    },
  ],
  custom: { name: 'Customer portal' },
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
