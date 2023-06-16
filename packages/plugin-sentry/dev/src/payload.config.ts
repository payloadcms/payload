/* eslint-disable import/no-relative-packages */
import path from 'path'
import { buildConfig } from 'payload/config'

import { sentry } from '../../src/index'
import Users from './collections/Users'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    sentry({
      dsn: 'https://61edebe5ee6d4d38a9d6459c7323d777@o4505289711681536.ingest.sentry.io/4505357688242176',
    }),
  ],
})
