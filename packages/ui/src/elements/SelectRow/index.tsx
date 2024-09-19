'use client'
import React from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider/index.js'
import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { useSelection } from '../../providers/Selection/index.js'
import { Locked } from '../Locked/index.js'
import './index.scss'

const baseClass = 'select-row'

export const SelectRow: React.FC = () => {
  const { selected, setSelection } = useSelection()
  const { rowData } = useTableCell()
  const { _isLocked, _userEditing } = rowData || {}

  const documentIsLocked = _isLocked && _userEditing

  if (documentIsLocked) {
    return <Locked user={_userEditing} />
  }

  return (
    <CheckboxInput
      checked={Boolean(selected.get(rowData.id))}
      className={[baseClass, `${baseClass}__checkbox`].join(' ')}
      onToggle={() => setSelection(rowData.id)}
    />
  )
}
