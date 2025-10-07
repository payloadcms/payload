import type { CollectionSlug, Document } from '../../index.js'
import type { TreeViewDocument } from '../types.js'

// import { isImage } from '../../uploads/isImage.js'
// import { getBestFitFromSizes } from '../../utilities/getBestFitFromSizes.js'

type Args = {
  // isUpload: boolean
  relationTo: CollectionSlug
  useAsTitle?: string
  value: Document
}
export function formatTreeViewDocumentItem({
  relationTo,
  useAsTitle,
  value,
}: Args): TreeViewDocument {
  const itemValue: TreeViewDocument['value'] = {
    id: value?.id,
    createdAt: value?.createdAt,
    parentDocIDs: value?._parentDocPath || [],
    parentID: value?._parentDoc || null,
    title: String((useAsTitle && value?.[useAsTitle]) || value['id']),
    updatedAt: value?.updatedAt,
  }

  // if (isUpload) {
  //   itemValue.filename = value.filename
  //   itemValue.mimeType = value.mimeType
  //   itemValue.url =
  //     value.thumbnailURL ||
  //     (isImage(value.mimeType)
  //       ? getBestFitFromSizes({
  //           sizes: value.sizes,
  //           targetSizeMax: 520,
  //           targetSizeMin: 300,
  //           url: value.url,
  //           width: value.width,
  //         })
  //       : undefined)
  // }

  return {
    itemKey: `${relationTo}-${value.id}`,
    relationTo,
    value: itemValue,
  }
}
