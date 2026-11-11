import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { foldersSlug, organizedDocsSlug, tagsSlug } from '../shared.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
  admin: { useAsTitle: 'name' },
  fields: [{ name: 'name', type: 'text', required: true }],
  folders: { parentFieldName: 'folder' },
  versions: false,
}

export const Tags: CollectionConfig = {
  slug: tagsSlug,
  admin: { useAsTitle: 'name' },
  fields: [{ name: 'name', type: 'text', required: true }],
  tags: true,
  versions: false,
}

export const OrganizedDocs: CollectionConfig = {
  slug: organizedDocsSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' },
    createFolderField({ relationTo: foldersSlug }),
    createTagField({ relationTo: tagsSlug }),
  ],
  versions: false,
}
