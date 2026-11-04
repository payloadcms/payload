import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFolderField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { seed } from './seed.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    collections: [
      { slug: 'users', auth: true, fields: [] },
      {
        slug: articlesSlug,
        access: { create: () => true, delete: () => true, read: () => true, update: () => true },
        fields: [{ name: 'title', type: 'text' }],
        nestedDocs: { parentFieldName: 'ancestor' },
        trash: true,
      },
      {
        slug: foldersSlug,
        access: { create: () => true, delete: () => true, read: () => true, update: () => true },
        admin: { useAsTitle: 'title' },
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
