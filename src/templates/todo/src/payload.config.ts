import { buildConfig } from 'payload/config';
import path from 'path';
import TodoLists from './collections/TodoLists';
import Users from './collections/Users';

export default buildConfig({
  serverURL: 'http://127.0.0.1:3000',
  admin: {
    user: Users.slug,
  },
  collections: [TodoLists, Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
})
