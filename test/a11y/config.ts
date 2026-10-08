import type { CollectionConfig } from 'payload'

import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { mediaSharpTransformer } from '../__helpers/shared/mediaSharpTransformer.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection, mediaSlug } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { UsersCollection, usersSlug } from './collections/Users/index.js'
import { seededAPIKey } from './constants.js'
import { MenuGlobal, menuSlug } from './globals/Menu/index.js'

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
    upload: {
      transformers: [mediaSharpTransformer({ mediaSlug })],
    },
    // ...extend config here
    admin: {
      components: {
        views: {
          StatusMessages: {
            Component: '/components/StatusMessages/index.js#StatusMessages',
            path: '/status-messages',
          },
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
          { widgetSlug: 'welcome', width: 'full' },
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
    plugins: [
      seoPlugin({
        generateURL: () => 'https://example.com/accessibility-post',
        globals: [menuSlug],
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: usersSlug,
      data: {
        apiKey: seededAPIKey,
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
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        title: 'Example post one, second version',
      },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        _status: 'published',
        title: 'Example post one, third version',
      },
      draft: false,
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'two',
        relatedPost: firstPost.id,
        title: 'Example post two',
      },
      draft: false,
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        relatedPost: firstPost.id,
        title: 'Example post three',
      },
      draft: false,
      overrideAccess: true,
    })
  },
  suite: 'a11y',
})
