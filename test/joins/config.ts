import {
  postgresAdapter,
  type PostgresOperatorHandler,
  postgresUnaccent,
  sql,
} from '@payloadcms/db-postgres'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { createFolderField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { defaultPostgresUrl } from '../dbAdapters.js'
import { AccessJoinArticles } from './collections/AccessJoinArticles.js'
import { AccessJoinNotes } from './collections/AccessJoinNotes.js'
import { AccessJoinParents } from './collections/AccessJoinParents.js'
import { Categories } from './collections/Categories.js'
import { CategoriesVersions } from './collections/CategoriesVersions.js'
import { HiddenPosts } from './collections/HiddenPosts.js'
import {
  OperatorHandlerJoinArticles,
  OperatorHandlerJoinNotes,
  OperatorHandlerJoinParents,
} from './collections/OperatorHandlerJoins.js'
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

const foldersSlug = 'folders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const caseInsensitiveCustomFieldHandler: PostgresOperatorHandler = {
  name: 'case-insensitive-custom-field',
  fieldTypes: ['text'],
  operators: ['not_equals'],
  transformOperands: ({ column, field, value }) => {
    if (field.custom?.useCaseInsensitiveComparison?.()) {
      return {
        column: sql`lower(${column})`,
        value: sql`lower(${value})`,
      }
    }

    return { column, value }
  },
}

const emptyInAvailabilityHandler: PostgresOperatorHandler = {
  name: 'empty-in-availability',
  fieldTypes: ['text'],
  operators: ['in'],
  transformOperands: ({ column, field, value }) => {
    if (field.name === 'availability' && Array.isArray(value) && value.length === 0) {
      return {
        column,
        value: ['available'],
      }
    }

    return { column, value }
  },
}

const systemIDOperatorHandler: PostgresOperatorHandler = {
  name: 'system-id-constraint',
  operators: ['not_equals'],
  transformOperands: ({ column, field, value }) => {
    if (field.name === 'id' && 'columnType' in column) {
      return {
        column: sql`'same-value'`,
        value: 'same-value',
      }
    }

    return { column, value }
  },
}

export default buildConfigWithDefaults({
  suite: 'joins',
  config: {
    ...(process.env.PAYLOAD_DATABASE === 'postgres'
      ? {
          db: postgresAdapter({
            extensions: ['unaccent'],
            pool: {
              connectionString:
                process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
            },
            query: {
              operatorHandlers: [
                postgresUnaccent(),
                caseInsensitiveCustomFieldHandler,
                emptyInAvailabilityHandler,
                systemIDOperatorHandler,
              ],
            },
          }),
        }
      : {}),
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: 'users',
    },
    collections: [
      AccessJoinArticles,
      AccessJoinNotes,
      AccessJoinParents,
      OperatorHandlerJoinArticles,
      OperatorHandlerJoinNotes,
      OperatorHandlerJoinParents,
      {
        slug: 'users',
        auth: true,
        fields: [
          {
            name: 'posts',
            type: 'join',
            collection: 'posts',
            on: 'author',
          },
        ],
        versions: false,
      },
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
        versions: false,
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
            localized: true,
            on: 'category',
          },
        ],
        versions: false,
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
        versions: false,
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
        versions: false,
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
        versions: false,
      },
      {
        slug: collectionRestrictedSlug,
        access: {
          read: () => ({ canRead: { equals: true } }),
        },
        admin: {
          useAsTitle: 'title',
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
        versions: false,
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
            maxDepth: 2,
            on: 'rel',
          },
        ],
        versions: false,
      },
      {
        slug: 'depth-joins-2',
        fields: [
          {
            name: 'joins',
            type: 'join',
            collection: 'depth-joins-1',
            maxDepth: 2,
            on: 'rel',
          },
        ],
        versions: false,
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
        versions: false,
      },
      {
        slug: 'multiple-collections-parents',
        access: { read: () => true },
        fields: [
          {
            name: 'children',
            type: 'join',
            admin: {
              defaultColumns: ['title', 'name', 'description'],
            },
            collection: ['multiple-collections-1', 'multiple-collections-2'],
            on: 'parent',
          },
        ],
        versions: false,
      },
      {
        slug: 'multiple-collections-1',
        access: { read: () => true },
        admin: { useAsTitle: 'title' },
        fields: [
          {
            name: 'parent',
            type: 'relationship',
            relationTo: 'multiple-collections-parents',
          },
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'name',
            type: 'text',
          },
        ],
        versions: false,
      },
      {
        slug: 'multiple-collections-2',
        access: { read: () => true },
        admin: { useAsTitle: 'title' },
        fields: [
          {
            name: 'parent',
            type: 'relationship',
            relationTo: 'multiple-collections-parents',
          },
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
        ],
        versions: false,
      },
      {
        slug: foldersSlug,
        admin: {
          group: 'Joins Test',
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
        folders: {
          collectionSpecific: { fieldName: 'folderType' },
          joinField: {
            name: 'children',
            admin: {
              defaultColumns: ['title', 'name', 'description'],
            },
          },
        },
        versions: false,
      },
      {
        slug: 'example-pages',
        admin: { useAsTitle: 'title' },
        fields: [
          createFolderField({ relationTo: foldersSlug }),
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'name',
            type: 'text',
          },
        ],
        versions: false,
      },
      {
        slug: 'example-posts',
        admin: { useAsTitle: 'title' },
        fields: [
          createFolderField({ relationTo: foldersSlug }),
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
        ],
        versions: false,
      },
      {
        slug: 'folderPoly1',
        fields: [
          {
            name: 'folderPoly1Title',
            type: 'text',
          },
          createFolderField({ relationTo: foldersSlug }),
        ],
        versions: false,
      },
      {
        slug: 'folderPoly2',
        fields: [
          {
            name: 'folderPoly2Title',
            type: 'text',
          },
          createFolderField({ relationTo: foldersSlug }),
        ],
        versions: false,
      },
    ],
    localization: {
      defaultLocale: 'en',
      locales: [
        { code: 'en', label: '(en)' },
        { code: 'es', label: '(es)' },
      ],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
