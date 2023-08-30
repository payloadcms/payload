import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';
import { devUser } from '../credentials.js';
import { MediaCollection } from './collections/Media/index.js';
import { PostsCollection, postsSlug } from './collections/Posts/index.js';
import { MenuGlobal } from './globals/Menu/index.js';

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    PostsCollection,
    MediaCollection,
    // ...add more collections here
  ],
  globals: [
    MenuGlobal,
    // ...add more globals here
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

    await payload.create({
      collection: postsSlug,
      data: {
        text: 'example post',
      },
    });
  },
});
