import type { CollectionConfig } from 'payload'

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
    })

    await payload.create({
      collection: 'payload-folders',
      data: {
        name: 'Accessibility folder',
      },
    })

    const firstPost = await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        title: 'Example post one',
      },
      draft: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        title: 'Example post one, second version',
      },
      draft: true,
    })

    await payload.update({
      id: firstPost.id,
      collection: postsSlug,
      data: {
        title: 'Example post one, third version',
      },
      draft: false,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'two',
        relatedPost: firstPost.id,
        title: 'Example post two',
      },
      draft: false,
    })

    await payload.create({
      collection: postsSlug,
      data: {
        accessibilitySelect: 'one',
        relatedPost: firstPost.id,
        title: 'Example post three',
      },
      draft: false,
    })
  },
  suite: 'a11y',
})
