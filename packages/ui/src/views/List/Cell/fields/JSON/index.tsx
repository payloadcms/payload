'use client'
import React from 'react'

import type { CellComponentProps } from 'payload/types'

import './index.scss'

export const JSONCell: React.FC<CellComponentProps<string>> = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data

  return (
    <code className="json-cell">
      <span>{JSON.stringify(textToShow)}</span>
    </code>
  )
}
