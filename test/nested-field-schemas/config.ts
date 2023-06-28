import { buildConfig } from '../buildConfig';
import { NestedFieldCollection } from './collections/NestedFields';
import { devUser } from '../credentials';
import Uploads from './collections/Upload';

export default buildConfig({
  collections: [
    NestedFieldCollection,
    Uploads,
  ],
  graphQL: {
    schemaOutputFile: './test/nested-field-schemas/schema.graphql',
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
