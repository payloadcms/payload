import React from 'react'

import type { CellComponentProps, TextareaField } from 'payload/types'

const TextareaCell: React.FC<CellComponentProps<TextareaField, string>> = ({ data }) => {
  const textToShow = data?.length > 100 ? `${data.substr(0, 100)}\u2026` : data
  return <span>{textToShow}</span>
}

export default TextareaCell
