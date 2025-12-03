import type { DefaultCellComponentProps } from 'payload'

import { toWords } from 'payload/shared'
import React from 'react'

export const QueryPresetsGroupByCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  if (!cellData || typeof cellData !== 'string') {
    return <div>No group by selected</div>
  }

  const isDescending = cellData.startsWith('-')
  const fieldName = isDescending ? cellData.slice(1) : cellData
  const direction = isDescending ? 'descending' : 'ascending'

  return (
    <div>
      {toWords(fieldName)} ({direction})
    </div>
  )
}
