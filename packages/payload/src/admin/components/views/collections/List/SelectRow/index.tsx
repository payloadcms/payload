import React from 'react'

import { CheckboxInput } from '../../../../forms/field-types/Checkbox/Input.js'
import { useSelection } from '../SelectionProvider/index.js'
import './index.scss'

const SelectRow: React.FC<{ id: number | string }> = ({ id }) => {
  const { selected, setSelection } = useSelection()

  return <CheckboxInput checked={selected[id]} onToggle={() => setSelection(id)} />
}

export default SelectRow
