'use client'
import type { DefaultCellComponentProps, JSONFieldClient } from 'payload'

import React from 'react'

import './index.scss'

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({ cellData }) => {
  const cellDataString = JSON.stringify(cellData)
  const textToShow =
    cellDataString.length > 100 ? `${cellDataString.substring(0, 100)}\u2026` : cellDataString

  return (
    <code className="json-cell">
      <span>{textToShow}</span>
    </code>
  )
}
