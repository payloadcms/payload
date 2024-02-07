'use client'
import React from 'react'

import type { CellComponentProps } from 'payload/types'

import './index.scss'

export const JSONCell: React.FC<CellComponentProps<string>> = ({ cellData }) => {
  const textToShow = cellData.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData

  return (
    <code className="json-cell">
      <span>{JSON.stringify(textToShow)}</span>
    </code>
  )
}
