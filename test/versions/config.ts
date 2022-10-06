import { buildConfig } from '../buildConfig';
import AutosavePosts from './collections/Autosave';
import DraftPosts from './collections/Drafts';
import AutosaveGlobal from './globals/Autosave';
import { devUser } from '../credentials';
import DraftGlobal from './globals/Draft';

export default buildConfig({
  collections: [
    AutosavePosts,
    DraftPosts,
  ],
  globals: [
    AutosaveGlobal,
    DraftGlobal,
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
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
