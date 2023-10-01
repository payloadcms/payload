import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { mongooseAdapter } from '@payloadcms/db-mongodb' // database-adapter-import
import { webpackBundler } from '@payloadcms/bundler-webpack' // bundler-import
import { createLexical } from '@payloadcms/richtext-lexical' // editor-import
import { buildConfig } from 'payload/config'

import Users from './collections/Users'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  editor: createLexical({}), // editor-config
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [payloadCloud()],
  // database-adapter-config-start
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // database-adapter-config-end
  bundler: webpackBundler(), // bundler-config
})
