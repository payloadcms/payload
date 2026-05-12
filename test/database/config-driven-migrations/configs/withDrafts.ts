import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { databaseAdapter } = await import('../../../databaseAdapter.js')

databaseAdapter.migrationDir = path.resolve(dirname, '../migrations')

export default buildConfig({
  secret: '__test__',
  db: databaseAdapter,
  collections: [
    {
      slug: 'posts',
      versions: { drafts: true },
      fields: [{ name: 'title', type: 'text' }],
    },
  ],
})
