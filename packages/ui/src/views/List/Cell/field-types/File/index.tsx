import React from 'react'

import type { CellComponentProps } from '../../types'

import Thumbnail from '../../../../../../elements/Thumbnail'
import './index.scss'

const baseClass = 'file'

const File: React.FC<CellComponentProps<any, any>> = ({ collection, data, rowData }) => {
  return (
    <div className={baseClass}>
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        collection={collection}
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

export default File
