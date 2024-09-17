'use client'
import type { DefaultCellComponentProps, UploadFieldClient } from 'payload'

import React from 'react'

import { Thumbnail } from '../../../../Thumbnail/index.js'
import './index.scss'

const baseClass = 'file'

export interface FileCellProps extends DefaultCellComponentProps<any, UploadFieldClient> {}

export const FileCell: React.FC<FileCellProps> = ({
  cellData: filename,
  customCellContext,
  rowData,
}) => {
  const { collectionSlug, uploadConfig } = customCellContext

  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        collectionSlug={collectionSlug}
        doc={{
          ...rowData,
          filename,
        }}
        fileSrc={rowData?.thumbnailURL || rowData?.url}
        size="small"
        uploadConfig={uploadConfig}
      />
      <span className={`${baseClass}__filename`}>{String(filename)}</span>
    </div>
  )
}
