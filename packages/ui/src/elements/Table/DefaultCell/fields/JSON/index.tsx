'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import './index.scss'

export const JSONCell: React.FC<DefaultCellComponentProps<string>> = ({ cellData }) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData

  return (
    <code className="json-cell">
      <span>{JSON.stringify(textToShow)}</span>
    </code>
  )
}
