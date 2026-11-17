import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFolderField } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { seed } from './seed.js'
import {
  articlesSlug,
  customLibrariesSlug,
  foldersSlug,
  librariesSlug,
  pagesSlug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const marker = ({ text, isMenuItem = false }: { isMenuItem?: boolean; text: string }) => ({
  path: '/components/ContentsMarker/index.tsx#ContentsMarker',
  clientProps: { isMenuItem, text },
})

export default buildConfigWithDefaults({
  config: {
    admin: { importMap: { baseDir: dirname } },
    collections: [
      { slug: 'users', auth: true, fields: [] },
      {
        slug: articlesSlug,
        labels: { singular: 'Article', plural: 'Articles' },
        admin: { useAsTitle: 'title' },
        access: { create: () => true, delete: () => true, read: () => true, update: () => true },
        fields: [
          { name: 'title', type: 'text' },
          createFolderField({ relationTo: foldersSlug }),
          createFolderField({ relationTo: librariesSlug }),
        ],
        nestedDocs: { parentFieldName: 'ancestor' },
        trash: true,
      },
      {
        slug: foldersSlug,
        access: { create: () => true, delete: () => true, read: () => true, update: () => true },
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text', required: true }],
        folders: true,
        trash: true,
      },
      {
        slug: librariesSlug,
        access: { create: () => true, delete: () => true, read: () => true, update: () => true },
        labels: { plural: { en: 'Libraries' }, singular: { en: 'Library' } },
        admin: {
          useAsTitle: 'name',
          components: {
            beforeList: [marker({ text: 'Before library list' })],
            afterList: [marker({ text: 'After library list' })],
            beforeListTable: [marker({ text: 'Before library table' })],
            afterListTable: [marker({ text: 'After library table' })],
            listMenuItems: [marker({ isMenuItem: true, text: 'Library menu action' })],
            views: { list: { NoResults: marker({ text: 'No library results' }) } },
          },
        },
        fields: [{ name: 'name', type: 'text', required: true }],
        hierarchy: {
          allowHasMany: false,
          collectionSpecific: { fieldName: 'acceptedTypes' },
          parentFieldName: 'shelfParent',
          admin: {
            components: {
              Icon: '@payloadcms/ui#TagIcon',
              SmallIcon: '@payloadcms/ui#TagIcon',
            },
          },
        },
      },
      {
        slug: customLibrariesSlug,
        fields: [{ name: 'name', type: 'text' }],
        admin: {
          useAsTitle: 'name',
          components: {
            views: {
              list: { Component: '/components/CustomLibraryList/index.tsx#CustomLibraryList' },
            },
          },
        },
        hierarchy: { allowHasMany: false, parentFieldName: 'customParent' },
      },
      {
        slug: pagesSlug,
        labels: { singular: 'Page', plural: 'Pages' },
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
