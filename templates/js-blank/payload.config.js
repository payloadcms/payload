import { buildConfig } from 'payload/config';
import Examples from './collections/Examples';
import Users from './collections/Users';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    // Add Collections here
    // Examples
  ],
});
