import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

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
      hello: './commands/hello.js#createHelloCommand',
    },
  },
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
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
