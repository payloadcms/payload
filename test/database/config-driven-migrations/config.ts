import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { databaseAdapter } = await import('../../databaseAdapter.js')

export default buildConfig({
  secret: '__test__',
  db: databaseAdapter,
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    {
      slug: 'posts',
      versions: { drafts: true },
      fields: [{ name: 'title', type: 'text' }],
    },
    {
      slug: 'articles',
      fields: [{ name: 'title', type: 'text', localized: true }],
    },
  ],
})
