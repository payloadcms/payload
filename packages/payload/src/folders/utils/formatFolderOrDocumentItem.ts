import type { CollectionSlug, Document } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

import { isImage } from '../../uploads/isImage.js'
import { getBestFitFromSizes } from '../../utilities/getBestFitFromSizes.js'

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
    _folderOrDocumentTitle: String((useAsTitle && value?.[useAsTitle]) || value['id']),
    createdAt: value?.createdAt,
    folderID: value?.[folderFieldName],
    folderType: value?.folderType || [],
    updatedAt: value?.updatedAt,
  }

  if (isUpload) {
    itemValue.filename = value.filename
    itemValue.mimeType = value.mimeType
    itemValue.url =
      value.thumbnailURL ||
      (isImage(value.mimeType)
        ? getBestFitFromSizes({
            sizes: value.sizes,
            targetSizeMax: 520,
            targetSizeMin: 300,
            url: value.url,
            width: value.width,
          })
        : undefined)
  }

  return {
    itemKey: `${relationTo}-${value.id}`,
    relationTo,
    value: itemValue,
  }
}
