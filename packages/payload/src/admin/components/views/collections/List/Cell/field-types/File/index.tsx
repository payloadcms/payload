import React from 'react'

import Thumbnail from '../../../../../../elements/Thumbnail'
import './index.scss'

const baseClass = 'file'

const File = ({ collection, data, rowData }) => {
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
