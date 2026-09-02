import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.PAYLOAD_TEST_CLI_CONFIG_LOG === 'true') {
  // eslint-disable-next-line no-console
  console.log('Loading CLI config.')
}

export default buildConfigWithDefaults({
  admin: {
    disable: true,
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'generated/importMap.js'),
    },
  },
  cli: {
    commands: {
      fail: './commands/fail.js#createFailCommand',
      hello: './commands/hello.js#createHelloCommand',
    },
  },
  collections: [
    {
      slug: 'pages',
      access: {
        read: () => ({ title: { equals: 'Readable through access control' } }),
        update: ({ id, req }) => {
          const idType = req.payload.collections.pages?.customIDType ?? req.payload.db.defaultIDType

          return id === undefined || typeof id === (idType === 'number' ? 'number' : 'string')
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'location',
          type: 'point',
        },
        {
          name: 'requireMetadata',
          type: 'checkbox',
        },
        {
          name: 'metadata',
          type: 'group',
          admin: {
            condition: (_data, siblingData) => siblingData.requireMetadata === true,
          },
          fields: [
            {
              name: 'description',
              type: 'text',
              required: true,
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.title === null) {
              throw new Error('Invalid data reached the collection operation.')
            }

            return data
          },
        ],
      },
      versions: {
        drafts: true,
      },
    },
    {
      slug: 'media',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      upload: {
        staticDir: path.resolve(dirname, 'generated/media'),
      },
    },
    {
      slug: 'custom-ids',
      access: {
        update: ({ id, req }) => {
          const idType =
            req.payload.collections['custom-ids']?.customIDType ?? req.payload.db.defaultIDType

          return id === undefined || typeof id === (idType === 'number' ? 'number' : 'string')
        },
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      lockDocuments: false,
    },
  ],
  db: {
    ...databaseAdapter,
    init: (args) => {
      const adapter = databaseAdapter.init(args)
      adapter.migrationDir = path.resolve(dirname, 'migrations')

      return adapter
    },
  },
  globals: [
    {
      slug: 'settings',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.title === null) {
              throw new Error('Invalid data reached the global operation.')
            }

            return data
          },
        ],
      },
    },
  ],
  jobs: {
    deleteJobOnComplete: false,
    tasks: [
      {
        slug: 'noop',
        handler: async ({ req }) => {
          await req.payload.create({
            collection: 'pages',
            data: { title: 'CLI job ran' },
          } as never)

          return { output: {} }
        },
        schedule: [{ cron: '* * * * * *', queue: 'default' }],
      },
    ],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'generated/payload-types.ts'),
  },
})
