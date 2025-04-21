import type { CollectionSlug } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

type Args = {
  isUpload: boolean
  relationTo: CollectionSlug
  useAsTitle?: string
  value: any
}
export function formatFolderOrDocumentItem({
  isUpload,
  relationTo,
  useAsTitle,
  value,
}: Args): FolderOrDocument {
  const itemValue: FolderOrDocument['value'] = {
    id: value?.id,
    _folderOrDocumentTitle: value[useAsTitle || 'id'],
    _parentFolder: value?._parentFolder,
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
