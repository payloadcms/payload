'use client'
import React from 'react'
import { CellComponentProps } from 'payload/types'

import './index.scss'

export const CheckboxCell: React.FC<CellComponentProps<boolean>> = ({ cellData }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(cellData)}</span>
  </code>
)
