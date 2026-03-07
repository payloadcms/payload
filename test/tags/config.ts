import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { createTagField, createTagsCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'

export const tagsSlug = 'tags'
export const categoriesSlug = 'categories'
export const postsSlug = 'posts'
export const pagesSlug = 'pages'
export const mediaSlug = 'media'

// Tags hierarchy collection (multi-select)
export const Tags = createTagsCollection({
  slug: tagsSlug,
  labels: { singular: 'Tag', plural: 'Tags' },
  useAsTitle: 'name',
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
  hierarchy: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#FF10F0' }, // Tags - neon pink
          path: '/components/ColoredTagIcon.tsx#ColoredTagIcon',
        },
      },
    },
  },
})

// Categories hierarchy collection (single-select)
export const Categories = createTagsCollection({
  slug: categoriesSlug,
  labels: { singular: 'Category', plural: 'Categories' },
  useAsTitle: 'name',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#DFFF00' }, // Categories - neon yellow
          path: '/components/ColoredTagIcon.tsx#ColoredTagIcon',
        },
      },
    },
  },
})

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
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Categories, Posts, Pages, Media, Tags],
  debug: true,
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Seed taxonomy data
    try {
      await seed(payload)
    } catch (error) {
      payload.logger.error('Failed to seed taxonomy data:')
      payload.logger.error(error)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export {
  Categories as CategoriesCollection,
  Media as MediaCollection,
  Pages as PagesCollection,
  Posts as PostsCollection,
  Tags as TagsCollection,
}
