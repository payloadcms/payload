'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import React from 'react'

export const RichTextCell: React.FC<DefaultCellComponentProps<any[]>> = ({ cellData }) => {
  const flattenedText = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}
