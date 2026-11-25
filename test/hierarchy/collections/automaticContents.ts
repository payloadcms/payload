import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

export const automaticFoldersSlug = 'automatic-folders'
export const automaticPagesSlug = 'automatic-pages'
export const automaticMediaSlug = 'automatic-media'

const folders: CollectionConfig = {
  slug: automaticFoldersSlug,
  admin: { useAsTitle: 'name' },
  fields: [{ name: 'name', type: 'text', required: true }],
  folders: true,
}

function folderDocuments(slug: string): CollectionConfig {
  return {
    slug,
    access: { read: () => ({ visible: { equals: true } }) },
    admin: { useAsTitle: 'title' },
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'visible', type: 'checkbox' },
      createFolderField({ relationTo: automaticFoldersSlug }),
    ],
  }
}

export const automaticContentsCollections = [
  folders,
  folderDocuments(automaticPagesSlug),
  folderDocuments(automaticMediaSlug),
]
