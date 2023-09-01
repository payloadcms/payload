import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { devUser } from '../credentials';
import { ErrorFieldsCollection } from './collections/ErrorFields';
import Uploads from './collections/Upload';

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
