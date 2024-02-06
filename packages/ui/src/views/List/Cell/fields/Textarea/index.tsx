'use client'
import React from 'react'

import type { CellComponentProps } from 'payload/types'

export const TextareaCell: React.FC<CellComponentProps<string>> = ({ data }) => {
  const textToShow = data?.length > 100 ? `${data.substr(0, 100)}\u2026` : data
  return <span>{textToShow}</span>
}
