'use client'
import type { ClientCollectionConfig, CodeFieldClient, DefaultCellComponentProps } from 'payload'

import React from 'react'

import './index.scss'

export interface CodeCellProps extends DefaultCellComponentProps<CodeFieldClient> {
  readonly collectionConfig: ClientCollectionConfig
  readonly nowrap?: boolean
}

export const CodeCell: React.FC<CodeCellProps> = ({ cellData, nowrap }) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData

  const noWrapStyle: React.CSSProperties = nowrap ? { whiteSpace: 'nowrap' } : {}

  return (
    <code className="code-cell" style={noWrapStyle}>
      <span>{textToShow}</span>
    </code>
  )
}
