import type { SanitizedCollectionConfig } from '../index.js'

export const addFolderFieldToCollection = ({
  collection,
  folderFieldName,
  folderSlug,
}: {
  collection: SanitizedCollectionConfig
  folderFieldName: string
  folderSlug: string
}): void => {
  collection.fields.push({
    name: folderFieldName,
    type: 'relationship',
    admin: {
      allowCreate: false,
      allowEdit: false,
      components: {
        Cell: '@payloadcms/ui/rsc#FolderTableCell',
        Field: '@payloadcms/ui/rsc#FolderEditField',
      },
    },
    index: true,
    label: 'Folder',
    relationTo: folderSlug,
  })
}
