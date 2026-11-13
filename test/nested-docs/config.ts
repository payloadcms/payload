import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFolderField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { RestrictedDocuments } from './collections/RestrictedDocuments/index.js'
import { seed } from './seed.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    collections: [
      { slug: 'users', auth: true, fields: [] },
      RestrictedDocuments,
      {
        slug: articlesSlug,
        access: {
          create: () => true,
          delete: () => true,
          read: ({ req }) =>
            req.context.denyArticleReads
              ? false
              : req.context.denyArticleID
                ? { id: { not_equals: req.context.denyArticleID } }
                : true,
          update: () => true,
        },
        admin: {
          useAsTitle: 'title',
          baseFilter: ({ req }) =>
            req.context.denyArticleTitles ? undefined : { title: { not_equals: 'Hidden article' } },
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            access: { read: ({ req }) => !req.context.denyArticleTitles },
          },
          { name: 'secret', type: 'text', access: { read: () => false } },
          createFolderField({ relationTo: foldersSlug }),
        ],
        nestedDocs: { parentFieldName: 'ancestor' },
        trash: true,
      },
      {
        slug: foldersSlug,
        access: {
          create: () => true,
          delete: () => true,
          read: ({ req }) =>
            req.context.denyFolderID ? { id: { not_equals: req.context.denyFolderID } } : true,
          update: () => true,
        },
        admin: {
          useAsTitle: 'title',
          baseFilter: () => ({ title: { not_equals: 'Hidden folder' } }),
        },
        fields: [{ name: 'title', type: 'text', required: true }],
        folders: true,
      },
      {
        slug: pagesSlug,
        access: {
          create: () => true,
          delete: () => true,
          read: ({ req }) =>
            req.context.denyReadID ? { id: { not_equals: req.context.denyReadID } } : true,
          update: () => true,
        },
        admin: {
          baseFilter: () => ({ title: { not_equals: 'Hidden from tree' } }),
          defaultColumns: ['title', '_status', 'updatedAt'],
          useAsTitle: 'title',
        },
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'slug', type: 'text' },
          {
            name: 'parent',
            type: 'relationship',
            admin: { position: 'sidebar' },
            hasMany: false,
            label: ({ t }) => t('general:parentDocument'),
            relationTo: pagesSlug,
          },
          createFolderField({ relationTo: foldersSlug }),
        ],
        nestedDocs: { parentFieldName: 'parent' },
        versions: { drafts: true },
      },
    ],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  seed,
  suite: 'nested-docs',
})
