import type { SanitizedCollectionConfig } from '../index.js'

import { buildFolderField } from './buildFolderField.js'

export const addFolderFieldToCollection = ({
  collection,
  enableCollectionScoping,
  folderFieldName,
  folderSlug,
}: {
  collection: SanitizedCollectionConfig
  enableCollectionScoping: boolean
  folderFieldName: string
  folderSlug: string
}): void => {
  collection.fields.push(
    buildFolderField({
      enableCollectionScoping,
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
