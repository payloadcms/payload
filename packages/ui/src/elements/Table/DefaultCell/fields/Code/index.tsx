'use client'
import type { CodeFieldClient, DefaultCellComponentProps } from 'payload'

import React from 'react'

import './index.scss'

export interface CodeCellProps extends DefaultCellComponentProps<string, CodeFieldClient> {
  readonly nowrap?: boolean
}

export const CodeCell: React.FC<CodeCellProps> = ({ cellData, nowrap }) => {
  const textToShow = cellData.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData

  const noWrapStyle: React.CSSProperties = nowrap ? { whiteSpace: 'nowrap' } : {}

  return (
    <code className="code-cell" style={noWrapStyle}>
      <span>{textToShow}</span>
    </code>
  )
}
