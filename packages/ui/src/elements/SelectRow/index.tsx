'use client'
import React, { useMemo } from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider/index.js'
import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { useSelection } from '../../providers/Selection/index.js'
import './index.scss'

const baseClass = 'select-row'

export const SelectRow: React.FC = () => {
  const { selected, setSelection } = useSelection()
  const { rowData } = useTableCell()

  const isChecked = useMemo(() => {
    let isChecked = false

    for (const [id, isSelected] of selected) {
      if (id === rowData.id && isSelected) {
        isChecked = true
        break
      }
    }

    return isChecked
  }, [selected, rowData])

  return (
    <CheckboxInput
      checked={isChecked}
      className={[baseClass, `${baseClass}__checkbox`].join(' ')}
      onToggle={() => setSelection(rowData.id)}
    />
  )
}
