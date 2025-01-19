'use client'
import type { DefaultCellComponentProps, TextareaFieldClient } from 'payload'

import React from 'react'

export const TextareaCell: React.FC<DefaultCellComponentProps<TextareaFieldClient>> = (props) => {
  console.log('TextareaCell props:', props)
  const textToShow =
    props.cellData?.length > 100 ? `${props.cellData.substring(0, 100)}\u2026` : props.cellData
  return <span>{textToShow}</span>
}
