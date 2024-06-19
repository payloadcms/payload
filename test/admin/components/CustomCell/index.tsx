'use client'
import type { CellComponentProps } from 'payload'

import { useTableCell } from '@payloadcms/ui'
import React from 'react'

export const CustomCell: React.FC<CellComponentProps> = (props) => {
  const context = useTableCell()
  return <div>{`Custom cell: ${context.cellData || 'No data'}`}</div>
}
