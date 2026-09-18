import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { createTagField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'

export const tagsSlug = 'tags'
export const categoriesSlug = 'categories'
export const postsSlug = 'posts'
export const pagesSlug = 'pages'
export const mediaSlug = 'media'

// Tags hierarchy collection (multi-select)
export const Tags: CollectionConfig = {
  slug: tagsSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  labels: { plural: 'Tags', singular: 'Tag' },
  tags: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#FF10F0' }, // Tags - neon pink
          path: '/components/ColoredTagIcon.tsx#ColoredTagIcon',
        },
      },
    },
  },
  versions: false,
}

// Categories hierarchy collection (single-select)
export const Categories: CollectionConfig = {
  slug: categoriesSlug,
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
  labels: { plural: 'Categories', singular: 'Category' },
  tags: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#DFFF00' }, // Categories - neon yellow
          path: '/components/ColoredTagIcon.tsx#ColoredTagIcon',
        },
      },
    },
  },
  versions: false,
}

// Posts collection that references both tags (multi) and categories (single)
export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    // Single-select category (hasMany: false)
    createTagField({ hasMany: false, label: 'Category', relationTo: categoriesSlug }),
    // Multi-select tags (hasMany: true, the default)
    createTagField({ hasMany: true, label: 'Tags', relationTo: tagsSlug }),
  ],
  versions: false,
}

// Pages collection that references tags
export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    createTagField({ hasMany: true, relationTo: tagsSlug }),
  ],
  versions: false,
}

// Media collection that references tags
export const Media: CollectionConfig = {
  slug: mediaSlug,
  admin: {
    useAsTitle: 'filename',
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
    },
    createTagField({ hasMany: true, relationTo: tagsSlug }),
  ],
  upload: true,
  versions: false,
}

export default buildConfigWithDefaults({
  suite: 'tags',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Categories, Posts, Pages, Media, Tags],
    debug: true,
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

    try {
      await seed(payload)
    } catch (error) {
      payload.logger.error('Failed to seed taxonomy data:')
      payload.logger.error(error)
    }
  },
})

export {
  Categories as CategoriesCollection,
  Media as MediaCollection,
  Pages as PagesCollection,
  Posts as PostsCollection,
  Tags as TagsCollection,
}
