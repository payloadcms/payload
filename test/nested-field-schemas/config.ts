import { buildConfig } from '../buildConfig';
import { NestedFieldCollection } from './collections/NestedFields';
import { devUser } from '../credentials';

export default buildConfig({
  collections: [
    NestedFieldCollection,
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
