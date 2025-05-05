import type { CollectionSlug, Document } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

type Args = {
  isUpload: boolean
  relationTo: CollectionSlug
  useAsTitle?: string
  value: Document
}
export function formatFolderOrDocumentItem({
  isUpload,
  relationTo,
  useAsTitle,
  value,
}: Args): FolderOrDocument {
  const itemValue: FolderOrDocument['value'] = {
    id: value?.id,
    _folder: value?._folder,
    _folderOrDocumentTitle: value[useAsTitle || 'id'],
    createdAt: value?.createdAt,
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
