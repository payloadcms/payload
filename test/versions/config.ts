import { buildConfig } from '../buildConfig';
import AutosavePosts from './collections/Autosave';
import DraftPosts from './collections/Drafts';
import AutosaveGlobal from './globals/Autosave';
import { devUser } from '../credentials';
import DraftGlobal from './globals/Draft';
import VersionPosts from './collections/Versions';
import { draftSlug } from './shared';

export default buildConfig({
  collections: [
    AutosavePosts,
    DraftPosts,
    VersionPosts,
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

    const { id: draftID } = await payload.create({
      collection: draftSlug,
      draft: true,
      data: {
        id: 1,
        title: 'draft title',
        description: 'draft description',
        radio: 'test',
      },
    });

    await payload.create({
      collection: draftSlug,
      draft: false,
      data: {
        id: 2,
        title: 'published title',
        description: 'published description',
        radio: 'test',
        _status: 'published',
      },
    });

    await payload.update({
      collection: draftSlug,
      id: draftID,
      draft: true,
      data: {
        title: 'draft title 2',
      },
    });

    await payload.update({
      collection: draftSlug,
      id: draftID,
      draft: true,
      data: {
        title: 'draft title 3',
      },
    });
  },
});
