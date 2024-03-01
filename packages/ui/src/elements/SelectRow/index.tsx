'use client'
import React from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider'
import { CheckboxInput } from '../../forms/fields/Checkbox/Input'
import { useSelection } from '../../providers/SelectionProvider'
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
