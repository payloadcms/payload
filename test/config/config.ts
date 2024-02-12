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
          handler: (_, res): void => {
            res.json({ message: 'hi' })
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
              custom: { description: 'The blockOne of this page' },
            },
          ],
          custom: { description: 'The blocks of this page' },
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
          handler: (req, res): void => {
            const { name } = req.query
            res.json({ message: `Hi ${name}!` })
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
      handler: (req, res): void => {
        res.json(req.payload.config)
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
