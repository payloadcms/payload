import type { CollectionSlug, Document } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

type Args = {
  folderFieldName: string
  isUpload: boolean
  relationTo: CollectionSlug
  useAsTitle?: string
  value: Document
}
export function formatFolderOrDocumentItem({
  folderFieldName,
  isUpload,
  relationTo,
  useAsTitle,
  value,
}: Args): FolderOrDocument {
  const itemValue: FolderOrDocument['value'] = {
    id: value?.id,
    _folderOrDocumentTitle: (useAsTitle && value?.[useAsTitle]) || value['id'],
    createdAt: value?.createdAt,
    folderID: value?.[folderFieldName],
    updatedAt: value?.updatedAt,
  }

  if (isUpload) {
    itemValue.filename = value.filename
    itemValue.mimeType = value.mimeType
    itemValue.url = value.url
  }

  return {
    itemKey: `${relationTo}-${value.id}`,
    relationTo,
    value: itemValue,
  }
}
