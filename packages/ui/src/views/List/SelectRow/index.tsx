'use client'
import React from 'react'

import CheckboxInput from '../../../forms/fields/Checkbox'
import { useSelection } from '../SelectionProvider'
import './index.scss'

const baseClass = 'select-row'

const SelectRow: React.FC<{ id: number | string }> = ({ id }) => {
  const { selected, setSelection } = useSelection()

  return (
    <CheckboxInput
      checked={selected[id]}
      // onToggle={() => setSelection(id)}
      className={`${baseClass}__checkbox`}
    />
  )
}

export default SelectRow
