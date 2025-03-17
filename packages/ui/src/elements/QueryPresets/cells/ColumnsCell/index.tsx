import type { DefaultCellComponentProps } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

export const QueryPresetsColumnsCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  return (
    <div>
      {cellData
        ? transformColumnsToSearchParams(cellData)
            .map((column) => toWords(column))
            .join(', ')
        : 'No columns selected'}
    </div>
  )
}
