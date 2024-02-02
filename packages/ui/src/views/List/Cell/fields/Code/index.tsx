import React from 'react'

import type { CellComponentProps, CodeField } from 'payload/types'

import './index.scss'

export interface CodeCellProps extends CellComponentProps<CodeField, string> {
  nowrap?: boolean
}

const CodeCell: React.FC<CodeCellProps> = ({ data, nowrap }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data

  const noWrapStyle: React.CSSProperties = nowrap ? { whiteSpace: 'nowrap' } : {}

  return (
    <code className="code-cell" style={noWrapStyle}>
      <span>{textToShow}</span>
    </code>
  )
}

export default CodeCell
