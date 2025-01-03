import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Categories } from './collections/Categories.js'
import { CategoriesVersions } from './collections/CategoriesVersions.js'
import { HiddenPosts } from './collections/HiddenPosts.js'
import { Posts } from './collections/Posts.js'
import { SelfJoins } from './collections/SelfJoins.js'
import { Singular } from './collections/Singular.js'
import { Uploads } from './collections/Uploads.js'
import { Versions } from './collections/Versions.js'
import { seed } from './seed.js'
import {
  categoriesJoinRestrictedSlug,
  collectionRestrictedSlug,
  localizedCategoriesSlug,
  localizedPostsSlug,
  postsSlug,
  restrictedCategoriesSlug,
  restrictedPostsSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Posts,
    Categories,
    HiddenPosts,
    Uploads,
    Versions,
    CategoriesVersions,
    Singular,
    SelfJoins,
    {
      slug: localizedPostsSlug,
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'category',
          type: 'relationship',
          localized: true,
          relationTo: localizedCategoriesSlug,
        },
      ],
    },
    {
      slug: localizedCategoriesSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'relatedPosts',
          type: 'join',
          collection: localizedPostsSlug,
          on: 'category',
          localized: true,
        },
      ],
    },
    {
      slug: restrictedCategoriesSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          // this field is misconfigured to have `where` constraint using a restricted field
          name: 'restrictedPosts',
          type: 'join',
          collection: postsSlug,
          on: 'category',
          where: {
            restrictedField: { equals: 'restricted' },
          },
        },
      ],
    },
    {
      slug: categoriesJoinRestrictedSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          // join collection with access.read: () => false which should not populate
          name: 'collectionRestrictedJoin',
          type: 'join',
          collection: collectionRestrictedSlug,
          on: 'category',
        },
      ],
    },
    {
      slug: restrictedPostsSlug,
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: () => false,
            update: () => false,
          },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: restrictedCategoriesSlug,
        },
      ],
    },
    {
      slug: collectionRestrictedSlug,
      admin: {
        useAsTitle: 'title',
      },
      access: {
        read: () => ({ canRead: { equals: true } }),
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'canRead',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: categoriesJoinRestrictedSlug,
        },
      ],
    },
    {
      slug: 'depth-joins-1',
      fields: [
        {
          name: 'rel',
          type: 'relationship',
          relationTo: 'depth-joins-2',
        },
        {
          name: 'joins',
          type: 'join',
          collection: 'depth-joins-3',
          on: 'rel',
          maxDepth: 2,
        },
      ],
    },
    {
      slug: 'depth-joins-2',
      fields: [
        {
          name: 'joins',
          type: 'join',
          collection: 'depth-joins-1',
          on: 'rel',
          maxDepth: 2,
        },
      ],
    },
    {
      slug: 'depth-joins-3',
      fields: [
        {
          name: 'rel',
          type: 'relationship',
          relationTo: 'depth-joins-1',
        },
      ],
    },
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
