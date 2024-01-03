'use client'
import React from 'react'

import { SelectAllStatus, useSelection } from '../SelectionProvider'
import './index.scss'
import { CheckboxInput } from '../../../forms/field-types/Checkbox/Input'

const baseClass = 'select-all'

const SelectAll: React.FC = () => {
  const t = (key: string) => key // TODO: wire this in

  const { selectAll, toggleAll } = useSelection()

  return (
    <CheckboxInput
      aria-label={selectAll === SelectAllStatus.None ? t('selectAllRows') : t('deselectAllRows')}
      checked={
        selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable
      }
      id="select-all"
      onToggle={() => toggleAll()}
      partialChecked={selectAll === SelectAllStatus.Some}
      className={`${baseClass}__checkbox`}
    />
  )
}

export default SelectAll
