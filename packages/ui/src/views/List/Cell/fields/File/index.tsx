'use client'
import React from 'react'

import Thumbnail from '../../../../../elements/Thumbnail'
import { CellComponentProps } from 'payload/types'

import './index.scss'

const baseClass = 'file'

export const FileCell: React.FC<CellComponentProps<any>> = ({
  collectionConfig,
  data,
  rowData,
}) => {
  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        collection={collectionConfig}
        doc={{
          ...rowData,
          filename: data,
        }}
        size="small"
      />
      <span className={`${baseClass}__filename`}>{String(data)}</span>
    </div>
  )
}
