import type { DefaultCellComponentProps } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

export const ListPresetsColumnsCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  return (
    <div>
      {transformColumnsToSearchParams(cellData)
        .map((column) => toWords(column))
        .join(', ')}
    </div>
  )
}
