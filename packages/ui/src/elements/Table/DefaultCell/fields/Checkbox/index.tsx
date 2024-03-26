'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import React from 'react'

import './index.scss'

export const CheckboxCell: React.FC<DefaultCellComponentProps<boolean>> = ({ cellData }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(cellData)}</span>
  </code>
)
