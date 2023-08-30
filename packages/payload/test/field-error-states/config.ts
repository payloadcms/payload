import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';
import { devUser } from '../credentials.js';
import { ErrorFieldsCollection } from './collections/ErrorFields/index.js';
import Uploads from './collections/Upload/index.js';

export default buildConfigWithDefaults({
  collections: [
    ErrorFieldsCollection,
    Uploads,
  ],
  graphQL: {
    schemaOutputFile: './test/field-error-states/schema.graphql',
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
