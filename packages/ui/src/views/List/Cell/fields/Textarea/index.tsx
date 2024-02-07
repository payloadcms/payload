'use client'
import React from 'react'

import type { CellComponentProps } from 'payload/types'

export const TextareaCell: React.FC<CellComponentProps<string>> = ({ cellData }) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substr(0, 100)}\u2026` : cellData
  return <span>{textToShow}</span>
}
