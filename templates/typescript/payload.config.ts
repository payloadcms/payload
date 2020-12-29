import { buildConfig } from '@payloadcms/payload/config';
import Todo from './collections/Todo';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [
    Todo
  ],
});
