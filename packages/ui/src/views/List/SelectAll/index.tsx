'use client'
import React from 'react'

import { useTranslation } from '../../../exports'
import { SelectAllStatus, useSelection } from '../SelectionProvider'
import CheckboxInput from '../../../forms/fields/Checkbox'

import './index.scss'

const baseClass = 'select-all'

const SelectAll: React.FC = () => {
  const { selectAll, toggleAll } = useSelection()
  const { i18n } = useTranslation()

  return (
    <CheckboxInput
      path="select-all"
      aria-label={
        selectAll === SelectAllStatus.None
          ? i18n.t('general:selectAllRows')
          : i18n.t('general:deselectAllRows')
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
