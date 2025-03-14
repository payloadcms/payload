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
const targetThumbnailSize = 100

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
      fileSrc =
        Object.values<{ url?: string; width?: number }>(rowData.sizes).reduce(
          (closest, current) => {
            const size = current.width
            if (!size || size < targetThumbnailSize) {
              return closest
            }
            return !closest?.width || size < closest?.width ? current : closest
          },
          {},
        )?.url || fileSrc
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
