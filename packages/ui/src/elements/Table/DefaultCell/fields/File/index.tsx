'use client'
import type {
  ClientCollectionConfig,
  DefaultCellComponentProps,
  TextFieldClient,
  UploadFieldClient,
} from 'payload'

import { isImage } from 'payload/shared'
import React from 'react'

import './index.scss'
import { getBestFitFromSizes } from '../../../../../utilities/getBestFitFromSizes.js'
import { Thumbnail } from '../../../../Thumbnail/index.js'

const baseClass = 'file'

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

    if (isImage(rowData?.mimeType)) {
      fileSrc = getBestFitFromSizes({
        sizes: rowData?.sizes,
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
