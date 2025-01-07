'use client'
import type { DefaultCellComponentProps, JSONFieldClient } from 'payload'

import React from 'react'

import './index.scss'

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({ cellData }) => {
  const stringData = cellData ? JSON.stringify(cellData) : cellData
  const textToShow = stringData?.length > 100 ? `${stringData.substring(0, 100)}\u2026` : stringData

  return (
    <code className="json-cell">
      <span>{textToShow}</span>
    </code>
  )
}
