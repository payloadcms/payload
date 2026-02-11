import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { createTaxonomyField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'

export const tagsSlug = 'tags'
export const postsSlug = 'posts'
export const pagesSlug = 'pages'
export const mediaSlug = 'media'
export const categoriesSlug = 'categories'

// Tags taxonomy collection
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
  taxonomy: {
    relatedCollections: [postsSlug, pagesSlug, mediaSlug],
  },
}

// Posts collection that references tags
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
    createTaxonomyField({ hasMany: true, taxonomySlug: tagsSlug }),
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
    createTaxonomyField({ hasMany: true, taxonomySlug: tagsSlug }),
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
    createTaxonomyField({ hasMany: true, taxonomySlug: tagsSlug }),
  ],
  upload: true,
}

// Categories taxonomy with custom configuration
export const Categories: CollectionConfig = {
  slug: 'categories',
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
  taxonomy: {
    icon: './components/TaxonomyTabIcon.js#TaxonomyTabIcon',
    parentFieldName: 'parentCategory',
  },
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Tags, Posts, Pages, Media, Categories],
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
