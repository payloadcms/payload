'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import { useTableCell } from '@payloadcms/ui/elements/Table'
import React from 'react'

export const RichTextCell: React.FC<DefaultCellComponentProps<any[]>> = () => {
  const { cellData } = useTableCell()
  const flattenedText = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}
