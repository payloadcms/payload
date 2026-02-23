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
export const postsSlug = 'posts'
export const pagesSlug = 'pages'
export const mediaSlug = 'media'
export const categoriesSlug = 'categories'

// Categories hierarchy with custom configuration
export const Categories = createTagsCollection({
  slug: categoriesSlug,
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
        Icon: './components/TaxonomyTabIcon.js#TaxonomyTabIcon',
      },
    },
    parentFieldName: 'parentCategory',
    // relatedCollections auto-discovered from fields
  },
})

// Tags hierarchy collection
export const Tags = createTagsCollection({
  slug: tagsSlug,
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
  // relatedCollections auto-discovered from fields
})

// Posts collection that references tags and categories
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
    createTagField({ hasMany: true, relationTo: tagsSlug, label: 'Tags' }),
    createTagField({ relationTo: categoriesSlug, label: 'Categories' }),
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
    createTagField({ hasMany: false, relationTo: tagsSlug }),
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
  collections: [Posts, Pages, Media, Tags, Categories],
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
