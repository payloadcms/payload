'use client'
import type { CellComponentProps } from 'payload/types'

import React from 'react'

export const TextareaCell: React.FC<CellComponentProps<string>> = ({ cellData }) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substr(0, 100)}\u2026` : cellData
  return <span>{textToShow}</span>
}
