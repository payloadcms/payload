'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import { Thumbnail } from '@payloadcms/ui/elements/Thumbnail'
import React from 'react'

import './index.scss'

const baseClass = 'file'

export interface FileCellProps extends DefaultCellComponentProps<any> {}

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
        fileSrc={rowData?.thumbnailURL}
        size="small"
        uploadConfig={uploadConfig}
      />
      <span className={`${baseClass}__filename`}>{String(filename)}</span>
    </div>
  )
}
