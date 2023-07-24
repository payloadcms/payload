import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { devUser } from '../credentials';
import { Arrays } from './collections/Arrays';
import { Blocks } from './collections/Blocks';

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    Arrays,
    Blocks,
  ],
  graphQL: {
    schemaOutputFile: './test/_community/schema.graphql',
  },

  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
  },
});
