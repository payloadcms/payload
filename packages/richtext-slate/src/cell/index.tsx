'use client'
import type { CellComponentProps } from 'payload/types'

import React from 'react'

export const RichTextCell: React.FC<CellComponentProps<any[]>> = ({ cellData }) => {
  const flattenedText = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}
