import { buildConfig } from 'payload/config';
import path from 'path';
import Events from './collections/Events';
import Locations from './collections/Location';
import Staff from './collections/Staff';
import Users from './collections/Users';
import BeforeLogin from './components/BeforeLogin';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
    components: {
      beforeLogin: [BeforeLogin],
    },
  },
  collections: [
    Events,
    Locations,
    Staff,
    Users,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
