import React from 'react'

import type { TextareaField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

const TextareaCell: React.FC<CellComponentProps<TextareaField, string>> = ({ data }) => {
  const textToShow = data?.length > 100 ? `${data.substr(0, 100)}\u2026` : data
  return <span>{textToShow}</span>
}

export default TextareaCell
