import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js';
import AutosavePosts from './collections/Autosave.js';
import DraftPosts from './collections/Drafts.js';
import AutosaveGlobal from './globals/Autosave.js';
import { devUser } from '../credentials.js';
import DraftGlobal from './globals/Draft.js';
import VersionPosts from './collections/Versions.js';
import { draftSlug } from './shared.js';

export default buildConfigWithDefaults({
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
  indexSortableFields: true,
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
