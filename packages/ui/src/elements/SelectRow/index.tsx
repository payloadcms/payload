'use client'
import React from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider/index.js'
import { CheckboxInput } from '../../forms/fields/Checkbox/Input.js'
import { useSelection } from '../../providers/Selection/index.jsx'
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
