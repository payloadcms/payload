'use client'
import type { DefaultCellComponentProps } from 'payload'

import { useTableCell } from '@payloadcms/ui/client'
import React from 'react'

export const RichTextCell: React.FC<DefaultCellComponentProps<any[]>> = () => {
  const { cellData } = useTableCell()
  const flattenedText = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}
