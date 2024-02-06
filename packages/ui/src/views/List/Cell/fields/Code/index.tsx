import React from 'react'

import type { CellComponentProps } from 'payload/types'

import './index.scss'

export interface CodeCellProps extends CellComponentProps<string> {
  nowrap?: boolean
}

export const CodeCell: React.FC<CodeCellProps> = ({ data, nowrap }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data

  const noWrapStyle: React.CSSProperties = nowrap ? { whiteSpace: 'nowrap' } : {}

  return (
    <code className="code-cell" style={noWrapStyle}>
      <span>{textToShow}</span>
    </code>
  )
}
