'use client'
import { CheckboxInput, useSelection } from '@payloadcms/ui'
import React from 'react'

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
