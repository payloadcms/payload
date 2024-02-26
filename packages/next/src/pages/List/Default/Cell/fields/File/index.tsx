'use client'
import type { CellComponentProps } from 'payload/types'

import { Thumbnail } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'file'

export interface FileCellProps extends CellComponentProps<any> {}

export const FileCell: React.FC<FileCellProps> = ({ cellData, customCellContext, rowData }) => {
  const { uploadConfig } = customCellContext

  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        doc={{
          ...rowData,
          filename: cellData,
        }}
        size="small"
        uploadConfig={uploadConfig}
      />
      <span className={`${baseClass}__filename`}>{String(cellData)}</span>
    </div>
  )
}
