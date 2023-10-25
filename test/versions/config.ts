import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import AutosavePosts from './collections/Autosave'
import DraftPosts from './collections/Drafts'
import Posts from './collections/Posts'
import VersionPosts from './collections/Versions'
import AutosaveGlobal from './globals/Autosave'
import DraftGlobal from './globals/Draft'
import { draftSlug, titleToDelete } from './shared'

export default buildConfigWithDefaults({
  collections: [Posts, AutosavePosts, DraftPosts, VersionPosts],
  globals: [AutosaveGlobal, DraftGlobal],
  indexSortableFields: true,
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const blocksField = [
      {
        blockType: 'block',
        localized: 'text',
        text: 'text',
      },
    ]

    const { id: draftID } = await payload.create({
      collection: draftSlug,
      data: {
        id: 1,
        blocksField,
        description: 'draft description',
        radio: 'test',
        title: 'draft title',
      },
      draft: true,
    })

    await payload.create({
      collection: draftSlug,
      data: {
        id: 2,
        _status: 'published',
        blocksField,
        description: 'published description',
        radio: 'test',
        title: 'published title',
      },
      draft: false,
    })

    await payload.create({
      collection: draftSlug,
      data: {
        blocksField,
        description: 'published description',
        title: titleToDelete,
      },
      draft: true,
    })

    await payload.update({
      id: draftID,
      collection: draftSlug,
      data: {
        title: 'draft title 2',
      },
      draft: true,
    })

    await payload.update({
      id: draftID,
      collection: draftSlug,
      data: {
        title: 'draft title 3',
      },
      draft: true,
    })
  },
})
