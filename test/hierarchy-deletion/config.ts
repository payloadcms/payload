import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { Articles } from './collections/Articles/index.js'
import { Content } from './collections/Content/index.js'
import { Folders } from './collections/Folders/index.js'
import { LocalizedPages } from './collections/LocalizedPages/index.js'
import { Pages } from './collections/Pages/index.js'
import { Tags } from './collections/Tags/index.js'
import { Users } from './collections/Users/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    collections: [Users, Articles, Pages, Folders, Tags, Content, LocalizedPages],
    localization: { defaultLocale: 'en', locales: ['en', 'es'] },
    db:
      process.env.PAYLOAD_DATABASE === 'sqlite'
        ? sqliteAdapter({
            autoIncrement: true,
            client: { url: process.env.SQLITE_URL || 'file:./payload.db' },
            transactionOptions: { behavior: 'immediate' },
          })
        : databaseAdapter,
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  suite: 'hierarchy-deletion',
})
