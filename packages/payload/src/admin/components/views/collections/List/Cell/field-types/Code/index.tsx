import React from 'react'

import type { CodeField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

import './index.scss'

const CodeCell: React.FC<CellComponentProps<CodeField, string>> = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data

  return (
    <code className="code-cell">
      <span>{textToShow}</span>
    </code>
  )
}

export default CodeCell
