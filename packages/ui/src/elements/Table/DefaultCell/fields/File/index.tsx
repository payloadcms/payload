'use client'
import type {
  ClientCollectionConfig,
  DefaultCellComponentProps,
  TextFieldClient,
  UploadFieldClient,
} from 'payload'

import React from 'react'

import { Thumbnail } from '../../../../Thumbnail/index.js'
import './index.scss'

const baseClass = 'file'

const targetThumbnailSizeMin = 40
const targetThumbnailSizeMax = 180

export interface FileCellProps
  extends DefaultCellComponentProps<TextFieldClient | UploadFieldClient> {
  readonly collectionConfig: ClientCollectionConfig
}

export const FileCell: React.FC<FileCellProps> = ({
  cellData: filename,
  collectionConfig,
  field,
  rowData,
}) => {
  const fieldPreviewAllowed = 'displayPreview' in field ? field.displayPreview : undefined
  const previewAllowed = fieldPreviewAllowed ?? collectionConfig.upload?.displayPreview ?? true

  if (previewAllowed) {
    let fileSrc: string | undefined = rowData?.thumbnailURL ?? rowData?.url

    if (
      rowData?.url &&
      !rowData?.thumbnailURL &&
      typeof rowData?.mimeType === 'string' &&
      rowData?.mimeType.startsWith('image') &&
      rowData?.sizes
    ) {
      const sizes = Object.values<{ url?: string; width?: number }>(rowData.sizes)

      const bestFit = sizes.reduce(
        (closest, current) => {
          if (!current.width || current.width < targetThumbnailSizeMin) {
            return closest
          }

          if (current.width >= targetThumbnailSizeMin && current.width <= targetThumbnailSizeMax) {
            return !closest.width ||
              current.width < closest.width ||
              closest.width < targetThumbnailSizeMin ||
              closest.width > targetThumbnailSizeMax
              ? current
              : closest
          }

          if (
            !closest.width ||
            (!closest.original &&
              closest.width < targetThumbnailSizeMin &&
              current.width > closest.width) ||
            (closest.width > targetThumbnailSizeMax && current.width < closest.width)
          ) {
            return current
          }

          return closest
        },
        { original: true, url: rowData?.url, width: rowData?.width },
      )

      fileSrc = bestFit.url || fileSrc
    }

    return (
      <div className={baseClass}>
        <Thumbnail
          className={`${baseClass}__thumbnail`}
          collectionSlug={collectionConfig?.slug}
          doc={{
            ...rowData,
            filename,
          }}
          fileSrc={fileSrc}
          size="small"
          uploadConfig={collectionConfig?.upload}
        />
        <span className={`${baseClass}__filename`}>{String(filename)}</span>
      </div>
    )
  } else {
    return <>{String(filename)}</>
  }
}
