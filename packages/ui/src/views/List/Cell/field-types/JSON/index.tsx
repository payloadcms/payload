import React from 'react'

import type { JSONField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

import './index.scss'

const JSONCell: React.FC<CellComponentProps<JSONField, string>> = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data

  return (
    <code className="json-cell">
      <span>{JSON.stringify(textToShow)}</span>
    </code>
  )
}

export default JSONCell
