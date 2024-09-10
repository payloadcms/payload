import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { TextFields } from './collections/TextFields'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

console.log(path.resolve(dirname))

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [TextFields],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI as string,
  }),
  editor: lexicalEditor({}),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  secret: process.env.PAYLOAD_SECRET as string,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
