import { buildConfig } from 'payload/config';
import Todo from './collections/Todo';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [
    Todo
  ],
});
