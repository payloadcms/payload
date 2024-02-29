'use client'
import React from 'react'

import { CheckboxInput, useSelection, useTableCell } from '../..'
import './index.scss'

const baseClass = 'select-row'

export const SelectRow: React.FC = () => {
  const { selected, setSelection } = useSelection()
  const { rowData } = useTableCell()

  return (
    <CheckboxInput
      checked={selected?.[rowData?.id]}
      className={`${baseClass}__checkbox`}
      onToggle={() => setSelection(rowData.id)}
    />
  )
}
