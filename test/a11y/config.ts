import type { CollectionConfig } from 'payload'

import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
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

export default buildConfigWithDefaults({
  config: {
    // ...extend config here
    admin: {
      components: {
        views: {
          FocusIndicatorsView: {
            Component: '/components/FocusIndicatorsView.js#FocusIndicatorsView',
            path: '/focus-indicators',
          },
        },
      },
      dashboard: {
        defaultLayout: [
          { widgetSlug: 'collections', width: 'full' },
          {
            data: {
              relatedCollection: postsSlug,
              sortField: 'removedField',
              title: 'Contrast query error',
            },
            widgetSlug: 'collection-query',
            width: 'medium',
          },
        ],
        widgets: [],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [FolderCollection, PostsCollection, MediaCollection],
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
    plugins: [seoPlugin({ collections: [] })],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'payload-folders',
      data: {
        name: 'Accessibility folder',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        deletedAt: '2026-01-01T00:00:00.000Z',
        title: 'Contrast trashed post',
      },
      overrideAccess: true,
    })

    const firstPost = await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        subtitle: 'Original subtitle',
        title: 'Example post one',
      },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        subtitle: 'Replacement subtitle',
        title: 'Example post one, second version',
      },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
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
