'use client'
import type { CellComponentProps, RichTextField } from 'payload/types'

import React from 'react'

import type { AdapterArguments } from '../types'

const RichTextCell: React.FC<
  CellComponentProps<RichTextField<any[], AdapterArguments, AdapterArguments>, any>
> = ({ data }) => {
  const flattenedText = data?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}

export default RichTextCell
