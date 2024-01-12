import React from 'react'

import Thumbnail from '../../../../../elements/Thumbnail'
import './index.scss'
import { CellComponentProps } from 'payload/types'

const baseClass = 'file'

const File: React.FC<CellComponentProps<any, any>> = ({ collectionConfig, data, rowData }) => {
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

export default File
