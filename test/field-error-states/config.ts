import { buildConfig } from '../buildConfig';
import { ErrorFieldsCollection } from './collections/ErrorFields';
import { devUser } from '../credentials';
import Uploads from './collections/Upload';

export default buildConfig({
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
