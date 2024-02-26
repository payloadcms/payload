'use client'
import type { CellComponentProps } from 'payload/types'

import React from 'react'

import './index.scss'

export const CheckboxCell: React.FC<CellComponentProps<boolean>> = ({ cellData }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(cellData)}</span>
  </code>
)
