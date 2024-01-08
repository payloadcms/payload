'use client'
import React from 'react'

import { SelectAllStatus, useSelection } from '../SelectionProvider'
import './index.scss'
import { CheckboxInput } from '../../../forms/field-types/Checkbox/Input'

const baseClass = 'select-all'

const SelectAll: React.FC = () => {
  // TODO(i18n)
  const t = (key: string) => key

  const { selectAll, toggleAll } = useSelection()

  return (
    <CheckboxInput
      path="select-all"
      aria-label={
        selectAll === SelectAllStatus.None
          ? t('general:selectAllRows')
          : t('general:deselectAllRows')
      }
      checked={
        selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable
      }
      id="select-all"
      onChange={() => toggleAll()}
      partialChecked={selectAll === SelectAllStatus.Some}
      className={`${baseClass}__checkbox`}
    />
  )
}

export default SelectAll
