import React from 'react'

import type { CheckboxField } from 'payload/types'
import type { CellComponentProps } from '../../types'

import './index.scss'

// Handles boolean values
const Checkbox: React.FC<CellComponentProps<CheckboxField>> = ({ data }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(data)}</span>
  </code>
)
export default Checkbox
