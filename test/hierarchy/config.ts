import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

// Simple Pages collection with hierarchy enabled
export const Pages: CollectionConfig = {
  slug: 'pages',
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
      type: 'text',
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
  },
  versions: {
    drafts: true,
  },
}

// Categories collection with hierarchy enabled (using defaults)
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
  hierarchy: {
    parentFieldName: 'parentCategory',
  },
}

// Departments collection with custom field names
export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: {
    useAsTitle: 'deptName',
  },
  fields: [
    {
      name: 'deptName',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parentDept',
    slugPathFieldName: '_breadcrumbSlug',
    titlePathFieldName: '_breadcrumbTitle',
  },
}

// Organizations collection with hierarchy
export const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'orgName',
  },
  fields: [
    {
      name: 'orgName',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
  hierarchy: {
    parentFieldName: 'parentOrg',
  },
}

// Products collection with localized title field
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      localized: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
    // Self-referential: products nest under other products
  },
  versions: {
    drafts: true,
  },
}

// Posts collection with localized title field for testing localization
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'content',
      type: 'text',
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
    // Self-referential: posts can nest under other posts
  },
  versions: {
    drafts: true,
  },
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Categories, Departments, Organizations, Products, Posts],
  debug: true,
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export {
  Categories as CategoriesCollection,
  Departments as DepartmentsCollection,
  Organizations as OrganizationsCollection,
  Pages as PagesCollection,
  Posts as PostsCollection,
  Products as ProductsCollection,
}
