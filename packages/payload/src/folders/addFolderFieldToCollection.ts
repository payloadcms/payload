import type { SanitizedCollectionConfig } from '../index.js'

import { buildFolderField } from './buildFolderField.js'

export const addFolderFieldToCollection = ({
  collection,
  folderFieldName,
  folderSlug,
}: {
  collection: SanitizedCollectionConfig
  folderFieldName: string
  folderSlug: string
}): void => {
  collection.fields.push(
    buildFolderField({
      folderFieldName,
      folderSlug,
      overrides: {
        admin: {
          allowCreate: false,
          allowEdit: false,
          components: {
            Cell: '@payloadcms/ui/rsc#FolderTableCell',
            Field: '@payloadcms/ui/rsc#FolderEditField',
          },
        },
      },
    }),
  )
}
