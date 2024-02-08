'use client'
import React from 'react'

import Thumbnail from '../../../../../elements/Thumbnail'
import { CellComponentProps } from 'payload/types'

import './index.scss'

const baseClass = 'file'

export interface FileCellProps extends CellComponentProps<any> {}

export const FileCell: React.FC<FileCellProps> = ({ customCellContext, cellData, rowData }) => {
  const { uploadConfig } = customCellContext

  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        uploadConfig={uploadConfig}
        doc={{
          ...rowData,
          filename: cellData,
        }}
        size="small"
      />
      <span className={`${baseClass}__filename`}>{String(cellData)}</span>
    </div>
  )
}
