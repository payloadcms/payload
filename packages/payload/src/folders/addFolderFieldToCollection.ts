import type { SanitizedCollectionConfig } from '../index.js'

import { buildFolderField } from './buildFolderField.js'

export const addFolderFieldToCollection = ({
  collection,
  collectionSpecific,
  folderFieldName,
  folderSlug,
}: {
  collection: SanitizedCollectionConfig
  collectionSpecific: boolean
  folderFieldName: string
  folderSlug: string
}): void => {
  collection.fields.push(
    buildFolderField({
      collectionSpecific,
      folderFieldName,
      folderSlug,
      overrides: {
        admin: {
          allowCreate: false,
          allowEdit: false,
          components: {
            Cell: '@payloadcms/ui/rsc#FolderTableCell',
            Field: '@payloadcms/ui/rsc#FolderField',
          },
        },
      },
    }),
  )
}
