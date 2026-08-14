import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../slugs.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
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
    admin: {
      components: {
        Icon: {
          clientProps: { color: 'muted' },
          path: '@payloadcms/ui#FolderIcon',
        },
      },
      treeLimit: 100,
      useHeaderButton: true,
    },
    allowHasMany: false,
    parentFieldName: 'parent',
  },
  labels: {
    plural: 'Folders',
    singular: 'Folder',
  },
  versions: false,
}
