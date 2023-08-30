import React from 'react'

import Thumbnail from '../../../../../../elements/Thumbnail/index.js'
import './index.scss'

const baseClass = 'file'

const File = ({ collection, data, rowData }) => {
  return (
    <div className={baseClass}>
      <Thumbnail
        doc={{
          ...rowData,
          filename: data,
        }}
        className={`${baseClass}__thumbnail`}
        collection={collection}
        size="small"
      />
      <span className={`${baseClass}__filename`}>{String(data)}</span>
    </div>
  )
}

export default File
