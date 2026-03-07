import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { createFolderField, createFoldersCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'

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
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#E67E22' }, // Orange
          path: '/components/ColorCircleIcon.tsx#ColorCircleIcon',
        },
      },
    },
    parentFieldName: 'parentDept',
    slugPathFieldName: '_breadcrumbSlug',
    titlePathFieldName: '_breadcrumbTitle',
  },
}

// Organizations collection with hierarchy (main test collection)
export const Organizations: CollectionConfig = {
  slug: 'organizations',
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
    createFolderField({ relationTo: 'folders' }),
  ],
  hierarchy: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#3498DB' }, // Light Blue
          path: '/components/ColorCircleIcon.tsx#ColorCircleIcon',
        },
      },
    },
    parentFieldName: 'parent',
  },
  versions: {
    drafts: true,
  },
}

// Folders collection with collectionSpecific (enables filter in tree search)
export const Folders = createFoldersCollection({
  slug: 'folders',
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
          clientProps: { color: '#9B59B6' }, // Purple
          path: '/components/ColorCircleIcon.tsx#ColorCircleIcon',
        },
      },
    },
    collectionSpecific: { fieldName: 'allowedTypes' },
    parentFieldName: 'parentFolder',
  },
})

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
    createFolderField({ relationTo: 'folders' }),
  ],
  hierarchy: {
    admin: {
      components: {
        Icon: {
          clientProps: { color: '#F1C40F' }, // Gold
          path: '/components/ColorCircleIcon.tsx#ColorCircleIcon',
        },
      },
    },
    parentFieldName: 'parent',
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
  collections: [Departments, Folders, Organizations, Products],
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
    await seed(payload)
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
