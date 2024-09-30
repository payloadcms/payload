'use client'
import type { DefaultCellComponentProps, TextareaFieldClient } from 'payload'

import React from 'react'

export const TextareaCell: React.FC<DefaultCellComponentProps<string, TextareaFieldClient>> = ({
  cellData,
}) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData
  return <span>{textToShow}</span>
}
