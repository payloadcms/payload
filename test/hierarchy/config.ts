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

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Categories, Departments],
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
  Pages as PagesCollection,
}
