'use client'
import type {
  ClientCollectionConfig,
  DefaultCellComponentProps,
  TextFieldClient,
  UploadFieldClient,
} from 'payload'

import { getBestFitFromSizes, isImage } from 'payload/shared'
import React from 'react'

import './index.css'
import { getVideoThumbnailSrc } from '../../../../../utilities/getVideoThumbnailSrc.js'
import { Thumbnail } from '../../../../Thumbnail/index.js'

const baseClass = 'file'

export interface FileCellProps extends DefaultCellComponentProps<
  TextFieldClient | UploadFieldClient
> {
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
    const isFileImage = isImage(rowData?.mimeType)
    const videoSrc = getVideoThumbnailSrc({
      mimeType: rowData?.mimeType,
      thumbnailURL: rowData?.thumbnailURL,
      url: rowData?.url,
    })
    let fileSrc: string | undefined = isFileImage
      ? rowData?.thumbnailURL || rowData?.url
      : (videoSrc ?? rowData?.thumbnailURL)

    if (isFileImage) {
      fileSrc = getBestFitFromSizes({
        sizes: rowData?.variants,
        thumbnailURL: rowData?.thumbnailURL,
        url: rowData?.url,
        width: rowData?.width,
      })
    }

    const uploadConfig = collectionConfig?.upload
    const imageCacheTag = uploadConfig?.cacheTags && rowData?.updatedAt

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
          imageCacheTag={imageCacheTag}
          isVideo={Boolean(videoSrc)}
          size="small"
          uploadConfig={uploadConfig}
        />
        <span className={`${baseClass}__filename`}>{String(filename)}</span>
      </div>
    )
  } else {
    return <>{String(filename)}</>
  }
}
