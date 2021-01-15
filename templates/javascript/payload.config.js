import { buildConfig } from 'payload/config';
import TodoLists from './collections/TodoLists';
import Users from './collections/Users';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [
    TodoLists,
    Users,
  ],
});
