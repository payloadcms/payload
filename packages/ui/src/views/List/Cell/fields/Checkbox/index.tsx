'use client'
import React from 'react'
import { CellComponentProps } from 'payload/types'

import './index.scss'

// Handles boolean values
export const CheckboxCell: React.FC<CellComponentProps<boolean>> = ({ data }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(data)}</span>
  </code>
)
