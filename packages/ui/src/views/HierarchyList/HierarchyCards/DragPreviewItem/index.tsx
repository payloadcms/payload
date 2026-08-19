'use client'

import React from 'react'

import type { TableRow } from '../../HierarchyTable/types.js'

import { Thumbnail } from '../../../../elements/Thumbnail/index.js'
import { FolderIcon } from '../../../../icons/Folder/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { getThumbnailSrc } from '../getThumbnailSrc.js'
import './index.css'

const baseClass = 'hierarchy-drag-preview-item'

/**
 * One tile in the drag stack: a small square thumbnail rather than a full card, so a multi-item drag
 * stays legible under the cursor instead of covering the folders it is aiming for.
 *
 * `Thumbnail` already falls back to the generic file graphic when a document has no image, so
 * non-upload collections need no special case here - only folders, which have an icon instead.
 */
export const DragPreviewItem: React.FC<{
  isHierarchyGroup: boolean
  row: TableRow
}> = ({ isHierarchyGroup, row }) => {
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
  const uploadConfig = collectionConfig?.upload

  if (isHierarchyGroup) {
    return (
      <div className={baseClass}>
        <span className={`${baseClass}__icon`}>{row._hierarchyIcon || <FolderIcon />}</span>
      </div>
    )
  }

  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        collectionSlug={collectionConfig?.slug}
        doc={row}
        fileSrc={getThumbnailSrc({ doc: row })}
        imageCacheTag={uploadConfig?.cacheTags ? (row.updatedAt as string) : undefined}
        size="expand"
        uploadConfig={uploadConfig}
      />
    </div>
  )
}
