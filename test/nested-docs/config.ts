import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFolderField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { seed } from './seed.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    db:
      process.env.PAYLOAD_DATABASE === 'sqlite'
        ? sqliteAdapter({
            autoIncrement: true,
            client: { url: process.env.SQLITE_URL || 'file:./payload.db' },
            transactionOptions: { behavior: 'immediate' },
          })
        : databaseAdapter,
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
          delete: ({ req }) => req.context.denyPageDeletes !== true,
          read: ({ req }) =>
            req.context.denyReadID ? { id: { not_equals: req.context.denyReadID } } : true,
          update: ({ data, req }) =>
            req.context.denyPageUpdates ||
            (req.context.denyCollectionParentTarget !== undefined &&
              data?.parent === req.context.denyCollectionParentTarget)
              ? false
              : req.context.denyPageID
                ? { id: { not_equals: req.context.denyPageID } }
                : true,
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
            access: {
              update: ({ data, req }) =>
                req.context.denyParentUpdates !== true &&
                !(
                  req.context.denyFieldParentTarget !== undefined &&
                  data?.parent === req.context.denyFieldParentTarget
                ),
            },
            admin: { position: 'sidebar' },
            hasMany: false,
            label: ({ t }) => t('general:parentDocument'),
            relationTo: pagesSlug,
          },
          createFolderField({ relationTo: foldersSlug }),
        ],
        hooks: {
          beforeChange: [
            ({ data, originalDoc, req }) => {
              if (
                req.context.failReparentID !== undefined &&
                req.context.failReparentID === originalDoc?.id
              ) {
                throw new Error('Promotion hook rejected the child')
              }
              return data
            },
          ],
        },
        nestedDocs: { parentFieldName: 'parent' },
        versions: { drafts: true },
      },
    ],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  seed,
  suite: 'nested-docs',
})
