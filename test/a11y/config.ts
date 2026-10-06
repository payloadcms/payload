import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { LocalizedPlainPosts } from './collections/LocalizedPlainPosts/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { UsersCollection, usersSlug } from './collections/Users/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const FolderCollection = {
  slug: 'payload-folders',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  folders: {
    joinField: {
      name: 'documentsAndFolders',
    },
  },
} satisfies CollectionConfig

const MediaAltCollection = {
  slug: 'media-alt',
  fields: [],
  upload: true,
} satisfies CollectionConfig

export default buildConfigWithDefaults({
  config: {
    // ...extend config here
    admin: {
      components: {
        views: {
          CustomIDModals: {
            Component: '/components/CustomIDModals/index.js#CustomIDModals',
            path: '/custom-modal-ids',
          },
          FocusIndicatorsView: {
            Component: '/components/FocusIndicatorsView.js#FocusIndicatorsView',
            path: '/focus-indicators',
          },
        },
      },
      dashboard: {
        defaultLayout: [
          { widgetSlug: 'collections', width: 'full' },
          { widgetSlug: 'upload-dropzone', width: 'small' },
        ],
        widgets: [],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      UsersCollection,
      FolderCollection,
      PostsCollection,
      LocalizedPlainPosts,
      MediaCollection,
      MediaAltCollection,
    ],
    editor: lexicalEditor({}),
    globals: [
      // ...add more globals here
      MenuGlobal,
    ],
    indexSortableFields: true,
    localization: {
      defaultLocale: 'en',
      locales: [
        {
          code: 'en',
          label: 'English',
        },
        {
          code: 'es',
          label: 'Spanish',
        },
      ],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: usersSlug,
      data: {
        apiKey: 'a11y-modal-dialog-fixture-key-1234',
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })

    const parentFolder = await payload.create({
      collection: 'payload-folders',
      data: {
        name: 'Accessibility folder',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'payload-folders',
      data: {
        name: 'Accessibility child folder',
        '_h_payload-folders': parentFolder.id,
      },
      overrideAccess: true,
    })

    for (const globalText of ['Original menu text', 'Updated menu text', 'Current menu text']) {
      await payload.updateGlobal({
        slug: 'menu',
        data: { globalText },
        overrideAccess: true,
      })
    }

    await payload.create({
      collection: 'payload-folders',
      data: {
        name: 'Accessibility final child folder',
        '_h_payload-folders': parentFolder.id,
      },
      overrideAccess: true,
    })

    const firstPost = await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        title: 'Example post one',
      },
      overrideAccess: true,
      version: 'draft',
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        title: 'Example post one, second version',
      },
      overrideAccess: true,
      version: 'draft',
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        _status: 'published',
        title: 'Example post one, third version',
      },
      overrideAccess: true,
      version: 'latest',
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'two',
        relatedPost: firstPost.id,
        title: 'Example post two',
      },
      overrideAccess: true,
      version: 'published',
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        relatedPost: firstPost.id,
        title: 'Example post three',
      },
      overrideAccess: true,
      version: 'published',
    })
  },
  suite: 'a11y',
})
